/**
 * Onglet Actions Weekly Ops — kanban 3 colonnes (À faire | En cours | Done)
 * + create inline. Shell mutualisé `KanbanBoard` / `KanbanCardShell` (missions).
 * Drawer édition = tranche suivante (PR3) ; clic carte = no-op (menu / drag).
 */

import { useEffect, useId, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { KanbanCardShell } from "../kanban/KanbanCardShell";
import type { WeeklyActionRow } from "../../types";
import { extractGristReferenceId } from "../../utils/gristReferences";
import {
  WEEKLY_ACTION_COLUMNS,
  columnKeyForWeeklyAction,
  defaultWeeklyActionDateFin,
  formatWeeklyActionDayShort,
  groupWeeklyActionsByColumn,
  isWeeklyActionDateFinOverdue,
  matchWeeklyActionPorteurId,
  parseLocalDateInputValue,
  parseWeeklyActionDate,
  toLocalDateInputValue,
  weeklyActionStatutLabel,
  type WeeklyActionColumnKey,
} from "../../utils/weeklyAction";
import {
  createWeeklyActionRecord,
  updateWeeklyActionColumn,
} from "../../utils/weeklyGristWrite";
import { firstNameFromDisplayName } from "../../utils/welcomeHomeByRole";

function ActionKanbanCard({
  action,
  columnKey,
  porteurLabel,
  missionLabel,
  busy,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  action: WeeklyActionRow;
  columnKey: WeeklyActionColumnKey;
  porteurLabel?: string;
  missionLabel?: string;
  busy: boolean;
  onDragStart: (id: number) => void;
  onDragEnd: () => void;
  onMove: (actionId: number, columnKey: WeeklyActionColumnKey) => void;
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
      onActivate={() => {
        /* PR3 : drawer édition — no-op V1 (menu / drag pour changer colonne). */
      }}
      onDragStart={(id) => onDragStart(Number(id))}
      onDragEnd={onDragEnd}
      moveTargets={moveTargets}
      onMove={(key) => onMove(action.id, key as WeeklyActionColumnKey)}
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
  equipeOptions: readonly { id: number; label: string }[];
  sessionEmail: string | null | undefined;
  busy: boolean;
  onCreated: () => Promise<void>;
  /** Après drag / menu colonne (recharger). Défaut = `onCreated`. */
  onColumnUpdated?: () => Promise<void>;
}) {
  const formId = useId();
  const titreInputId = `${formId}-titre`;
  const defaultPorteur = useMemo(
    () => matchWeeklyActionPorteurId(intervenants, sessionEmail),
    [intervenants, sessionEmail],
  );
  const defaultDateFin = useMemo(
    () => toLocalDateInputValue(defaultWeeklyActionDateFin()),
    [],
  );

  const [titre, setTitre] = useState("");
  const [porteurId, setPorteurId] = useState<string>("");
  const [missionId, setMissionId] = useState("");
  const [dateFin, setDateFin] = useState(defaultDateFin);
  const [error, setError] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragActionId, setDragActionId] = useState<number | null>(null);
  const [busyActionId, setBusyActionId] = useState<number | null>(null);

  useEffect(() => {
    setPorteurId(defaultPorteur != null ? String(defaultPorteur) : "");
  }, [defaultPorteur]);

  const byColumn = useMemo(
    () => groupWeeklyActionsByColumn(actions),
    [actions],
  );

  const openCount = useMemo(
    () =>
      (byColumn.get("a_faire")?.length ?? 0) +
      (byColumn.get("en_cours")?.length ?? 0),
    [byColumn],
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

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const trimmed = titre.trim();
    if (!trimmed) {
      setError("Indiquez un titre pour l’action.");
      document.getElementById(titreInputId)?.focus();
      return;
    }
    const porteur =
      porteurId !== "" && Number.isFinite(Number(porteurId))
        ? Number(porteurId)
        : null;
    const mission =
      missionId !== "" && Number.isFinite(Number(missionId))
        ? Number(missionId)
        : null;
    const fin = dateFin ? parseLocalDateInputValue(dateFin) : null;

    setError(null);
    setSubmitting(true);
    try {
      await createWeeklyActionRecord({
        titre: trimmed,
        porteurId: porteur,
        missionId: mission,
        dateFin: fin,
        email: sessionEmail ?? "",
      });
      setTitre("");
      setMissionId("");
      setDateFin(toLocalDateInputValue(defaultWeeklyActionDateFin()));
      setPorteurId(defaultPorteur != null ? String(defaultPorteur) : "");
      await onCreated();
      document.getElementById(titreInputId)?.focus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d’ajouter l’action.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = busy || submitting;

  return (
    <div>
      <div className="fr-mb-2w">
        <h2 className="fr-h5" style={{ margin: 0 }}>
          Actions
        </h2>
        <p className="fr-hint-text fr-mb-0" style={{ marginTop: "0.25rem" }}>
          À revoir à chaque weekly · {openCount} ouvertes
          {actions.length > openCount
            ? ` · ${actions.length - openCount} done`
            : ""}
        </p>
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
        hint={
          <p className="fr-hint-text fr-mb-0">
            Glissez une carte ou utilisez le menu pour changer de colonne.
            L’édition complète arrivera ensuite.
          </p>
        }
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
                  busy={busyActionId === action.id || busy}
                  onDragStart={setDragActionId}
                  onDragEnd={() => setDragActionId(null)}
                  onMove={(id, key) => void changeColumn(id, key)}
                />
              );
            },
          )
        }
      />

      <form
        id={formId}
        className="fr-mt-3w"
        onSubmit={(ev) => void onSubmit(ev)}
        aria-label="Nouvelle action"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "end",
        }}
      >
        <div style={{ flex: "1 1 14rem", minWidth: "12rem" }}>
          <Input
            label="Titre"
            nativeInputProps={{
              id: titreInputId,
              value: titre,
              onChange: (e) => setTitre(e.currentTarget.value),
              placeholder: "Nouvelle action (Entrée)",
              disabled,
              autoComplete: "off",
            }}
          />
        </div>
        <div style={{ flex: "1 1 10rem", minWidth: "9rem" }}>
          <Select
            label="Porteur"
            nativeSelectProps={{
              value: porteurId,
              onChange: (e) => setPorteurId(e.currentTarget.value),
              disabled,
            }}
          >
            <option value="">Sans porteur</option>
            {equipeOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ flex: "1 1 10rem", minWidth: "9rem" }}>
          <Select
            label="Mission"
            nativeSelectProps={{
              value: missionId,
              onChange: (e) => setMissionId(e.currentTarget.value),
              disabled,
            }}
          >
            <option value="">Sans mission liée</option>
            {missionOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ flex: "0 1 9rem" }}>
          <Input
            label="Date de fin"
            nativeInputProps={{
              type: "date",
              value: dateFin,
              onChange: (e) => setDateFin(e.currentTarget.value),
              disabled,
            }}
          />
        </div>
        <Button
          type="submit"
          priority="primary"
          iconId="fr-icon-add-line"
          disabled={disabled}
        >
          Ajouter
        </Button>
      </form>
    </div>
  );
}
