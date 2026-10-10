/**
 * Onglet Actions Weekly Ops — kanban 3 colonnes (À faire | En cours | Done)
 * + drawer SM create / édition + delete confirmé. Done aussi via drag / menu.
 */

import { useId, useMemo, useState, type DragEvent } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { KanbanCardShell } from "../kanban/KanbanCardShell";
import type { WeeklyActionRow } from "../../types";
import { extractGristReferenceId } from "../../utils/gristReferences";
import {
  WEEKLY_ACTION_COLUMNS,
  columnKeyForWeeklyAction,
  formatWeeklyActionDayShort,
  groupWeeklyActionsByColumn,
  isWeeklyActionDateFinOverdue,
  parseWeeklyActionDate,
  weeklyActionStatutLabel,
  type WeeklyActionColumnKey,
} from "../../utils/weeklyAction";
import {
  deleteWeeklyAction,
  updateWeeklyActionColumn,
} from "../../utils/weeklyGristWrite";
import { firstNameFromDisplayName } from "../../utils/welcomeHomeByRole";
import { WeeklyActionDeleteConfirmDialog } from "./WeeklyActionDeleteConfirmDialog";
import {
  WeeklyActionFormDrawer,
  type WeeklyActionDrawerMode,
} from "./WeeklyActionFormDrawer";

function ActionKanbanCard({
  action,
  columnKey,
  porteurLabel,
  missionLabel,
  busy,
  onDragStart,
  onDragEnd,
  onMove,
  onOpen,
  onRequestDelete,
}: {
  action: WeeklyActionRow;
  columnKey: WeeklyActionColumnKey;
  porteurLabel?: string;
  missionLabel?: string;
  busy: boolean;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onMove: (actionId: number, columnKey: WeeklyActionColumnKey) => void;
  onOpen: (action: WeeklyActionRow) => void;
  onRequestDelete: (action: WeeklyActionRow) => void;
}) {
  const titre = (action.Titre ?? "Action").trim() || "Action";
  const fait = action.Fait === true;
  const statutLabel = fait ? "Fait" : weeklyActionStatutLabel(action.Statut);
  const statutTone = fait
    ? "fr-badge--success"
    : action.Statut === "En cours"
      ? "fr-badge--blue-france"
      : "fr-badge--beige-gris-galet";
  const weeklyDu = parseWeeklyActionDate(action.Weekly_du);
  const dateFin = parseWeeklyActionDate(action.Date_fin);
  const overdue = isWeeklyActionDateFinOverdue(dateFin, new Date(), fait);

  const moveTargets = WEEKLY_ACTION_COLUMNS.filter((c) => c.key !== columnKey).map(
    (c) => ({ key: c.key, label: c.label }),
  );

  const metaParts = [
    porteurLabel ? `Porté par ${porteurLabel}` : null,
    missionLabel ?? null,
    weeklyDu ? `Weekly du ${formatWeeklyActionDayShort(weeklyDu)}` : null,
    dateFin
      ? `Fin le ${formatWeeklyActionDayShort(dateFin)}${overdue ? " (en retard)" : ""}`
      : null,
  ].filter(Boolean) as string[];

  const ariaLabel = [titre, statutLabel, ...metaParts].join(" — ");

  return (
    <KanbanCardShell
      cardId={action.id}
      busy={busy}
      draggable
      ariaLabel={ariaLabel}
      onActivate={() => onOpen(action)}
      onDragStart={(id) => onDragStart(Number(id))}
      onDragEnd={onDragEnd}
      moveTargets={moveTargets}
      onMove={(key) => onMove(action.id, key as WeeklyActionColumnKey)}
      menuItems={[
        {
          id: "delete-action",
          label: "Supprimer",
          iconClassName: "fr-icon-delete-line",
          onClick: () => onRequestDelete(action),
        },
      ]}
      menuTitle={`Actions — ${titre}`}
    >
      <h4 className="pilotage-kanban-card__title">{titre}</h4>
      <p className="pilotage-kanban-card__meta" style={{ marginBottom: "0.25rem" }}>
        <span className={`fr-badge fr-badge--sm ${statutTone}`}>{statutLabel}</span>
      </p>
      {metaParts.length > 0 ? (
        <p
          className="pilotage-kanban-card__meta fr-hint-text"
          style={{
            margin: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: "0.25rem 0.75rem",
          }}
        >
          {porteurLabel ? <span>Porté par {porteurLabel}</span> : null}
          {missionLabel ? <span>{missionLabel}</span> : null}
          {weeklyDu ? (
            <span>Weekly du {formatWeeklyActionDayShort(weeklyDu)}</span>
          ) : null}
          {dateFin ? (
            <span className={overdue ? "fr-text--error" : undefined}>
              Fin le {formatWeeklyActionDayShort(dateFin)}
              {overdue ? " (en retard)" : ""}
            </span>
          ) : null}
        </p>
      ) : null}
    </KanbanCardShell>
  );
}

export function WeeklyActionsPanel({
  actions,
  intervenants,
  missionTitleById,
  missionOptions,
  sujetOptions,
  equipeOptions,
  sessionEmail,
  busy,
  onCreated,
  onColumnUpdated,
}: {
  actions: readonly WeeklyActionRow[];
  intervenants: readonly {
    id: number;
    Prenom_Nom?: string | null;
    E_mail?: string | null;
  }[];
  missionTitleById: ReadonlyMap<number, string>;
  missionOptions: readonly { id: number; label: string }[];
  /**
   * Options sujet agenda (`Weekly_agenda`) pour le drawer create/édition.
   * Toujours passer la liste chargée (même vide) — le select « Sujet associé »
   * reste visible si la colonne Owner est prête.
   */
  sujetOptions: readonly { id: number; label: string }[];
  equipeOptions: readonly { id: number; label: string }[];
  sessionEmail: string | null | undefined;
  busy: boolean;
  onCreated: () => Promise<void>;
  /** Après drag / menu colonne (recharger). Défaut = `onCreated`. */
  onColumnUpdated?: () => Promise<void>;
}) {
  const addActionCtaId = useId();
  const [error, setError] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState<string | null>(null);
  const [dragActionId, setDragActionId] = useState<number | null>(null);
  const [busyActionId, setBusyActionId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] =
    useState<WeeklyActionDrawerMode>("create");
  const [drawerAction, setDrawerAction] = useState<WeeklyActionRow | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<WeeklyActionRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const byColumn = useMemo(
    () => groupWeeklyActionsByColumn(actions),
    [actions],
  );

  const porteurLabelById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of intervenants) {
      const label =
        firstNameFromDisplayName(p.Prenom_Nom ?? "") ||
        (p.Prenom_Nom ?? "").trim() ||
        `Personne #${p.id}`;
      m.set(p.id, label);
    }
    return m;
  }, [intervenants]);

  const reloadAfterWrite = onColumnUpdated ?? onCreated;

  const openCreate = () => {
    setDrawerMode("create");
    setDrawerAction(null);
    setDrawerOpen(true);
  };

  const openEdit = (action: WeeklyActionRow) => {
    setDrawerMode("edit");
    setDrawerAction(action);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    const restoreCta = drawerMode === "create";
    setDrawerOpen(false);
    setDrawerAction(null);
    if (restoreCta) {
      requestAnimationFrame(() => {
        document.getElementById(addActionCtaId)?.focus();
      });
    }
  };

  const requestDelete = (action: WeeklyActionRow) => {
    setError(null);
    setStatusOk(null);
    setDeleteTarget(action);
  };

  const cancelDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (deleteTarget == null) return;
    const id = deleteTarget.id;
    setDeleting(true);
    setError(null);
    setStatusOk(null);
    try {
      await deleteWeeklyAction(id);
      setDeleteTarget(null);
      if (drawerOpen && drawerAction?.id === id) {
        setDrawerOpen(false);
        setDrawerAction(null);
      }
      setStatusOk("Action supprimée.");
      await reloadAfterWrite();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l’action.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const changeColumn = async (
    actionId: number,
    columnKey: WeeklyActionColumnKey,
  ) => {
    const action = actions.find((a) => a.id === actionId);
    if (!action) return;
    if (columnKeyForWeeklyAction(action) === columnKey) return;

    setError(null);
    setStatusOk(null);
    setBusyActionId(actionId);
    try {
      await updateWeeklyActionColumn(actionId, columnKey);
      const label =
        WEEKLY_ACTION_COLUMNS.find((c) => c.key === columnKey)?.label ??
        columnKey;
      setStatusOk(`Action déplacée vers ${label}.`);
      await reloadAfterWrite();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de déplacer l’action.",
      );
    } finally {
      setBusyActionId(null);
      setDragActionId(null);
    }
  };

  const onDropColumn = (columnKey: WeeklyActionColumnKey) => (e: DragEvent) => {
    e.preventDefault();
    const id = dragActionId;
    setDragActionId(null);
    if (id == null) return;
    void changeColumn(id, columnKey);
  };

  const boardColumns = WEEKLY_ACTION_COLUMNS.map((col) => ({
    key: col.key,
    label: col.label,
    count: byColumn.get(col.key)?.length ?? 0,
    dot: col.dot,
    colBg: col.colBg,
  }));

  return (
    <div>
      <div
        className="fr-mb-2w"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem 0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 className="fr-h5" style={{ margin: 0 }}>
          Actions
        </h2>
        <Button
          type="button"
          priority="secondary"
          size="small"
          iconId="fr-icon-add-line"
          disabled={busy}
          onClick={openCreate}
          nativeButtonProps={{ id: addActionCtaId }}
        >
          Ajouter une action
        </Button>
      </div>

      {error ? (
        <Alert
          className="fr-mb-2w"
          severity="error"
          small
          title="Action"
          description={error}
          closable
          onClose={() => setError(null)}
        />
      ) : null}

      <KanbanBoard
        ariaLabel="Kanban des actions Weekly"
        columns={boardColumns}
        onDropColumn={(key, e) =>
          onDropColumn(key as WeeklyActionColumnKey)(e)
        }
        statusMessage={statusOk}
        renderCards={(columnKey) =>
          (byColumn.get(columnKey as WeeklyActionColumnKey) ?? []).map(
            (action) => {
              const mid = extractGristReferenceId(action.Mission) ?? null;
              const pid = extractGristReferenceId(action.Porteur) ?? null;
              return (
                <ActionKanbanCard
                  key={action.id}
                  action={action}
                  columnKey={columnKey as WeeklyActionColumnKey}
                  missionLabel={
                    mid != null ? missionTitleById.get(mid) : undefined
                  }
                  porteurLabel={
                    pid != null ? porteurLabelById.get(pid) : undefined
                  }
                  busy={
                    busyActionId === action.id ||
                    busy ||
                    (deleting && deleteTarget?.id === action.id)
                  }
                  onDragStart={setDragActionId}
                  onDragEnd={() => setDragActionId(null)}
                  onMove={(id, key) => void changeColumn(id, key)}
                  onOpen={openEdit}
                  onRequestDelete={requestDelete}
                />
              );
            },
          )
        }
      />

      <WeeklyActionFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        action={drawerAction}
        missionOptions={missionOptions}
        sujetOptions={sujetOptions}
        equipeOptions={equipeOptions}
        intervenants={intervenants}
        sessionEmail={sessionEmail}
        busy={busy || deleting}
        onClose={closeDrawer}
        onSaved={async () => {
          setError(null);
          await onCreated();
        }}
        onRequestDelete={requestDelete}
      />

      <WeeklyActionDeleteConfirmDialog
        open={deleteTarget != null}
        actionTitle={(deleteTarget?.Titre ?? "").trim()}
        busy={deleting}
        onCancel={cancelDelete}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
