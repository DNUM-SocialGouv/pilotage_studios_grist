import { useMemo, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { tdEquipeTag } from "../EquipeTags";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { KanbanCardShell } from "../kanban/KanbanCardShell";
import type { Mission, MissionEnfant } from "../../types.ts";
import {
  buildMissionsKanbanColumns,
  columnKeyForMissionStatut,
  groupMissionsByKanbanColumn,
  writeStatusForColumnKey,
  type MissionsKanbanColumnDef,
} from "../../utils/missionsKanban.ts";
import {
  equipeLabelForEnfant,
  formatCraJours,
  formatCraMontant,
  missionListeLibelle,
  produitLibelle,
  totauxCraDuLot,
  type CraCellState,
} from "../../utils/missionsListeTotaux.ts";
import { updateMissionRecord } from "../../utils/missionGristWrite.ts";
import type { CraTotaux } from "../../utils/suiviMensuel.ts";

type TeamShare = {
  equipe: string;
  count: number;
};

function teamSharesForLot(
  enfants: MissionEnfant[],
  equipesByIntervenantId: Map<number, string>,
): TeamShare[] {
  const map = new Map<string, number>();
  for (const e of enfants) {
    const eq = equipeLabelForEnfant(e, equipesByIntervenantId) ?? "—";
    map.set(eq, (map.get(eq) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([equipe, count]) => ({
    equipe,
    count,
  }));
}

export type MissionsListeKanbanProps = {
  missions: Mission[];
  enfantsByMasterId: Map<number, MissionEnfant[]>;
  equipesByIntervenantId: Map<number, string>;
  produitsById: Map<number, string>;
  craByEnfantId: Map<number, CraTotaux> | undefined;
  craState: CraCellState;
  /** Filtre statut multi (réaffiche colonnes masquées). */
  statutFilter: readonly string[];
  onEditMission?: (mission: Mission) => void;
  /** Après update Statut réussi (recharger la liste). */
  onStatutUpdated?: () => void | Promise<void>;
};

function MissionKanbanCard({
  mission,
  columnKey,
  columns,
  enfants,
  equipesByIntervenantId,
  produitsById,
  craByEnfantId,
  craState,
  busy,
  canWrite,
  onEditMission,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  mission: Mission;
  columnKey: string;
  columns: readonly MissionsKanbanColumnDef[];
  enfants: MissionEnfant[];
  equipesByIntervenantId: Map<number, string>;
  produitsById: Map<number, string>;
  craByEnfantId: Map<number, CraTotaux> | undefined;
  craState: CraCellState;
  busy: boolean;
  canWrite: boolean;
  onEditMission?: (mission: Mission) => void;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onMove: (missionId: number, columnKey: string) => void;
}) {
  const navigate = useNavigate();
  const name = missionListeLibelle(mission);
  const produit = produitLibelle(mission, produitsById);
  const totaux = totauxCraDuLot(enfants, craByEnfantId);
  const jours = formatCraJours(totaux, craState);
  const montant = formatCraMontant(totaux, craState);
  const shares = teamSharesForLot(enfants, equipesByIntervenantId);
  const equipesLabel =
    shares.length > 0
      ? shares.map((s) => `${s.equipe} (${s.count})`).join(", ")
      : "aucune équipe";
  const ficheTo = `/missions/${mission.id}`;

  const moveTargets = canWrite
    ? columns
        .filter((c) => c.key !== columnKey && c.key !== "autre")
        .map((c) => ({ key: c.key, label: c.label }))
    : [];

  const ariaLabel = [
    name,
    produit,
    `Jours : ${jours}`,
    `Montant : ${montant}`,
    `Équipes : ${equipesLabel}`,
    "ouvrir la fiche",
  ].join(" — ");

  return (
    <KanbanCardShell
      cardId={mission.id}
      busy={busy}
      draggable={canWrite}
      ariaLabel={ariaLabel}
      onActivate={() => navigate(ficheTo)}
      onDragStart={(id) => onDragStart(Number(id))}
      onDragEnd={onDragEnd}
      moveTargets={moveTargets}
      onMove={(key) => onMove(mission.id, key)}
      menuTitle={`Actions du lot ${name}`}
      menuItems={[
        {
          id: "fiche",
          label: "Ouvrir la fiche",
          iconClassName: "fr-icon-arrow-right-line",
          to: ficheTo,
        },
        ...(onEditMission
          ? [
              {
                id: "edit",
                label: "Modifier",
                iconClassName: "fr-icon-edit-line",
                onClick: () => onEditMission(mission),
              },
            ]
          : []),
      ]}
    >
      <h4 className="pilotage-kanban-card__title">{name}</h4>
      <p className="pilotage-kanban-card__meta">{produit}</p>
      <p className="pilotage-kanban-card__kpi">
        <span>
          <span className="fr-hint-text">Jours </span>
          <strong>{jours}</strong>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <span className="fr-hint-text">Montant </span>
          <strong>{montant}</strong>
        </span>
      </p>
      {shares.length > 0 ? (
        <ul className="pilotage-kanban-card__teams fr-mb-0">
          {shares.map((share) => (
            <li key={share.equipe}>
              {share.equipe === "—" ? (
                <span className="fr-text--xs">Sans équipe</span>
              ) : (
                tdEquipeTag(share.equipe)
              )}
              <span className="fr-badge fr-badge--sm fr-badge--no-icon">
                {share.count}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="fr-text--xs fr-hint-text fr-mb-0">Aucune prestation</p>
      )}
    </KanbanCardShell>
  );
}

export function MissionsListeKanban({
  missions,
  enfantsByMasterId,
  equipesByIntervenantId,
  produitsById,
  craByEnfantId,
  craState,
  statutFilter,
  onEditMission,
  onStatutUpdated,
}: MissionsListeKanbanProps) {
  const [showClosed, setShowClosed] = useState(false);
  const [dragMissionId, setDragMissionId] = useState<number | null>(null);
  const [busyMissionId, setBusyMissionId] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState<string | null>(null);

  const presentStatuts = useMemo(
    () => missions.map((m) => m.Statut ?? ""),
    [missions],
  );

  const columns = useMemo(
    () =>
      buildMissionsKanbanColumns({
        presentStatuts,
        statutFilter,
        showClosed,
      }),
    [presentStatuts, statutFilter, showClosed],
  );

  const byColumn = useMemo(
    () => groupMissionsByKanbanColumn(missions, columns),
    [missions, columns],
  );

  const canWrite = Boolean(onEditMission);

  const changeStatut = async (missionId: number, columnKey: string) => {
    const write = writeStatusForColumnKey(columnKey, columns);
    if (write == null) return;
    const mission = missions.find((m) => m.id === missionId);
    if (!mission) return;
    // Même colonne visuelle → no-op (évite d’écraser Récurrent si on repose sur En cours).
    if (columnKeyForMissionStatut(mission.Statut) === columnKey) return;

    setStatusError(null);
    setStatusOk(null);
    setBusyMissionId(missionId);
    try {
      await updateMissionRecord(missionId, { Statut: write });
      setStatusOk(`Statut mis à jour : ${write}.`);
      await onStatutUpdated?.();
    } catch (e) {
      setStatusError(
        e instanceof Error
          ? e.message
          : "Impossible de mettre à jour le statut du lot.",
      );
    } finally {
      setBusyMissionId(null);
      setDragMissionId(null);
    }
  };

  const onDropColumn = (columnKey: string) => (e: DragEvent) => {
    e.preventDefault();
    const missionId = dragMissionId;
    setDragMissionId(null);
    if (missionId == null || !canWrite) return;
    void changeStatut(missionId, columnKey);
  };

  const boardColumns = columns.map((col) => ({
    key: col.key,
    label: col.label,
    count: byColumn.get(col.key)?.length ?? 0,
    dot: col.dot,
    colBg: col.colBg,
  }));

  return (
    <div className="missions-kanban fr-mb-4w">
      <div className="fr-mb-2w">
        <ToggleSwitch
          label="Afficher terminées / annulées / archivées"
          checked={showClosed}
          onChange={setShowClosed}
          showCheckedHint={false}
        />
      </div>

      {statusError ? (
        <Alert
          severity="error"
          small
          title="Statut non enregistré"
          description={statusError}
          className="fr-mb-2w"
          closable
          onClose={() => setStatusError(null)}
        />
      ) : null}

      <KanbanBoard
        ariaLabel="Kanban des missions"
        columns={boardColumns}
        onDropColumn={(key, e) => onDropColumn(key)(e)}
        statusMessage={statusOk}
        renderCards={(columnKey) =>
          (byColumn.get(columnKey) ?? []).map((m) => (
            <MissionKanbanCard
              key={m.id}
              mission={m}
              columnKey={columnKey}
              columns={columns}
              enfants={enfantsByMasterId.get(m.id) ?? []}
              equipesByIntervenantId={equipesByIntervenantId}
              produitsById={produitsById}
              craByEnfantId={craByEnfantId}
              craState={craState}
              busy={busyMissionId === m.id}
              canWrite={canWrite}
              onEditMission={onEditMission}
              onDragStart={setDragMissionId}
              onDragEnd={() => setDragMissionId(null)}
              onMove={(id, key) => void changeStatut(id, key)}
            />
          ))
        }
      />
    </div>
  );
}
