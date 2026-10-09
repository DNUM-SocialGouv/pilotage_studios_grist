/**
 * Onglet Actions Weekly Ops — liste « en cours » + create inline.
 * Drawer édition / coche Fait = tranche suivante (PR3).
 */

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Link } from "react-router-dom";
import type { WeeklyActionRow } from "../../types";
import { extractGristReferenceId } from "../../utils/gristReferences";
import {
  defaultWeeklyActionDateFin,
  filterWeeklyActionsEnCours,
  formatWeeklyActionDayShort,
  isWeeklyActionDateFinOverdue,
  matchWeeklyActionPorteurId,
  parseLocalDateInputValue,
  parseWeeklyActionDate,
  sortWeeklyActionsEnCours,
  toLocalDateInputValue,
  weeklyActionStatutLabel,
} from "../../utils/weeklyAction";
import { createWeeklyActionRecord } from "../../utils/weeklyGristWrite";
import { firstNameFromDisplayName } from "../../utils/welcomeHomeByRole";

function ActionEnCoursRow({
  action,
  porteurLabel,
  missionLabel,
  missionId,
}: {
  action: WeeklyActionRow;
  porteurLabel?: string;
  missionLabel?: string;
  missionId: number | null;
}) {
  const titleId = `weekly-action-${action.id}-title`;
  const [notesOpen, setNotesOpen] = useState(false);
  const titre = (action.Titre ?? "Action").trim() || "Action";
  const statutLabel = weeklyActionStatutLabel(action.Statut);
  const statutTone =
    action.Statut === "En cours"
      ? "fr-badge--blue-france"
      : "fr-badge--beige-gris-galet";
  const weeklyDu = parseWeeklyActionDate(action.Weekly_du);
  const dateFin = parseWeeklyActionDate(action.Date_fin);
  const overdue = isWeeklyActionDateFinOverdue(dateFin, new Date(), false);
  const notes = (action.Notes ?? "").trim();

  return (
    <article
      aria-labelledby={titleId}
      style={{
        background: "var(--background-default-grey)",
        boxShadow: "inset 0 0 0 1px var(--border-default-grey)",
        padding: "0.625rem 0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem 0.5rem",
          alignItems: "center",
          marginBottom: "0.25rem",
        }}
      >
        <p
          id={titleId}
          className="fr-text--sm"
          style={{ margin: 0, fontWeight: 500, flex: "1 1 12rem" }}
        >
          {titre}
        </p>
        <span className={`fr-badge fr-badge--sm ${statutTone}`}>{statutLabel}</span>
      </div>
      <p
        className="fr-hint-text"
        style={{
          margin: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: "0.25rem 0.75rem",
        }}
      >
        {porteurLabel ? <span>Porté par {porteurLabel}</span> : null}
        {missionId != null && missionLabel ? (
          <Link className="fr-link fr-link--sm" to={`/missions/${missionId}`}>
            {missionLabel}
          </Link>
        ) : null}
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
      {notes ? (
        <div className="fr-mt-1w">
          <Button
            type="button"
            priority="tertiary no outline"
            size="small"
            onClick={() => setNotesOpen((o) => !o)}
            aria-expanded={notesOpen}
            aria-controls={`weekly-action-${action.id}-notes`}
          >
            {notesOpen ? "Masquer les notes" : "Voir les notes"}
          </Button>
          {notesOpen ? (
            <p
              id={`weekly-action-${action.id}-notes`}
              className="fr-text--sm fr-mb-0 fr-mt-1w"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {notes}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPorteurId(defaultPorteur != null ? String(defaultPorteur) : "");
  }, [defaultPorteur]);

  const enCours = useMemo(
    () => sortWeeklyActionsEnCours(filterWeeklyActionsEnCours(actions)),
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
          Actions en cours
        </h2>
        <p className="fr-hint-text fr-mb-0" style={{ marginTop: "0.25rem" }}>
          À revoir à chaque weekly · {enCours.length} en cours
        </p>
      </div>

      {error ? (
        <Alert
          className="fr-mb-2w"
          severity="error"
          small
          title="Action"
          description={error}
        />
      ) : null}

      {enCours.length === 0 ? (
        <p
          className="fr-text--sm fr-mb-3w"
          style={{ color: "var(--text-mention-grey)" }}
        >
          Aucune action en cours. Ajoutez un engagement ci-dessous.
        </p>
      ) : (
        <ul
          className="fr-raw-list fr-mb-3w"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            margin: 0,
            padding: 0,
          }}
        >
          {enCours.map((action) => {
            const mid = extractGristReferenceId(action.Mission) ?? null;
            const pid = extractGristReferenceId(action.Porteur) ?? null;
            return (
              <li key={action.id}>
                <ActionEnCoursRow
                  action={action}
                  missionId={mid}
                  missionLabel={
                    mid != null ? missionTitleById.get(mid) : undefined
                  }
                  porteurLabel={
                    pid != null ? porteurLabelById.get(pid) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <form
        id={formId}
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
