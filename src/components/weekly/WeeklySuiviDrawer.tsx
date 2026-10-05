/**
 * Drawer « Suivi mission » Weekly Ops V1 — satellite `Weekly_phase` + échanges
 * `Weekly_agenda`. Aucune écriture `Missions`.
 */

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Link } from "react-router-dom";
import type { WeeklyAgendaRow } from "../../types";
import {
  formatWeeklyAgendaCreatedAt,
  parseWeeklyAgendaCreatedAt,
  weeklyAgendaAuteurPrenom,
} from "../../utils/weeklyAgenda";
import {
  WEEKLY_METEO_CHOICES,
  WEEKLY_PHASES,
  WEEKLY_PHASE_OPS_COLUMNS_READY,
  isWeeklyPhaseKey,
  type WeeklyCard,
  type WeeklyPhaseKey,
} from "../../utils/weeklyPhases";

export type WeeklySuiviDrawerProps = {
  open: boolean;
  card: WeeklyCard | null;
  agendaLies: readonly WeeklyAgendaRow[];
  busy: boolean;
  onClose: () => void;
  onSaveSuivi: (input: {
    missionId: number;
    phaseRowId: number | null;
    phase: WeeklyPhaseKey;
    meteo: string;
    noteOps: string;
    coach: string;
  }) => Promise<void>;
  onViewSujet: (sujet: WeeklyAgendaRow) => void;
  onNouveauSujet: (missionId: number) => void;
};

const OWNER_COLUMNS_HINT =
  "Sur la table Weekly_phase (UI Grist, Owner) : créer Meteo (liste Calme / Nuageux / Orageux), Note_ops (texte) et Coach (texte). Ne pas créer ces colonnes sur Missions. Ensuite, passer le flag WEEKLY_PHASE_OPS_COLUMNS_READY à true dans le widget.";

export function WeeklySuiviDrawer({
  open,
  card,
  agendaLies,
  busy,
  onClose,
  onSaveSuivi,
  onViewSujet,
  onNouveauSujet,
}: WeeklySuiviDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const phaseFieldId = useId();
  const meteoFieldId = useId();
  const coachFieldId = useId();
  const noteFieldId = useId();

  const [draftPhase, setDraftPhase] = useState<WeeklyPhaseKey>("prochainement");
  const [draftMeteo, setDraftMeteo] = useState("");
  const [draftCoach, setDraftCoach] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [writeError, setWriteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || card == null) return;
    setDraftPhase(card.phase);
    setDraftMeteo(card.meteo);
    setDraftCoach(card.coach);
    setDraftNote(card.noteOps);
    setWriteError(null);
  }, [
    open,
    card,
    card?.missionId,
    card?.phase,
    card?.meteo,
    card?.coach,
    card?.noteOps,
  ]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        document.getElementById(phaseFieldId)?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, phaseFieldId]);

  const close = () => {
    dialogRef.current?.close();
  };

  const phaseMeta = WEEKLY_PHASES.find((p) => p.key === draftPhase);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (card == null) return;
    setWriteError(null);
    try {
      await onSaveSuivi({
        missionId: card.missionId,
        phaseRowId: card.phaseRowId,
        phase: draftPhase,
        meteo: draftMeteo,
        noteOps: draftNote,
        coach: draftCoach,
      });
    } catch (err) {
      setWriteError(
        err instanceof Error ? err.message : "Impossible d’enregistrer le suivi.",
      );
    }
  };

  const opsReady = WEEKLY_PHASE_OPS_COLUMNS_READY;

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-drawer-dialog pilotage-drawer-dialog--sm"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="pilotage-drawer-dialog__shell">
        <div
          className="pilotage-drawer-dialog__scrim"
          aria-hidden="true"
          onClick={() => {
            if (!busy) close();
          }}
        />
        <div className="pilotage-drawer-dialog__panel">
          <div className="pilotage-drawer-dialog__inner">
            <header className="fr-p-3w fr-pb-2w">
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                <div className="fr-col">
                  <h2 id={titleId} className="fr-h5 fr-mb-0">
                    Suivi · {card?.titre ?? "Mission"}
                  </h2>
                  <p className="fr-hint-text fr-mb-0 fr-mt-1v">
                    Données éditables = tables Weekly (pas la fiche mission)
                  </p>
                </div>
                <div className="fr-col-auto">
                  <button
                    type="button"
                    className="fr-btn--close fr-btn"
                    title="Fermer"
                    onClick={close}
                    disabled={busy}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </header>

            <div className="pilotage-drawer-dialog__body fr-px-3w fr-pb-3w fr-pt-0">
              {card == null ? null : (
                <form onSubmit={(e) => void submit(e)}>
                  {phaseMeta ? (
                    <p className="fr-badge fr-badge--info fr-badge--no-icon fr-mb-2w">
                      {phaseMeta.label}
                    </p>
                  ) : null}

                  <Select
                    label="Phase"
                    hint="Même donnée que le kanban (Weekly_phase)."
                    nativeSelectProps={{
                      id: phaseFieldId,
                      value: draftPhase,
                      disabled: busy,
                      onChange: (e) => {
                        const next = e.target.value;
                        if (isWeeklyPhaseKey(next)) setDraftPhase(next);
                      },
                    }}
                  >
                    {WEEKLY_PHASES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </Select>

                  {!opsReady ? (
                    <Alert
                      className="fr-mt-2w"
                      severity="info"
                      small
                      title="Colonnes Owner à poser"
                      description={OWNER_COLUMNS_HINT}
                    />
                  ) : null}

                  <Select
                    className="fr-mt-2w"
                    label="Météo"
                    hint={
                      opsReady
                        ? "Suivi ops Weekly (pas la météo fiche mission)."
                        : "Lecture seule — colonne Weekly_phase.Meteo absente."
                    }
                    nativeSelectProps={{
                      id: meteoFieldId,
                      value: draftMeteo,
                      disabled: busy || !opsReady,
                      onChange: (e) => setDraftMeteo(e.target.value),
                    }}
                  >
                    <option value="">—</option>
                    {WEEKLY_METEO_CHOICES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                  <Input
                    className="fr-mt-2w"
                    label="Coach"
                    hintText={
                      opsReady
                        ? "Prénom·nom libre (ops Weekly)."
                        : "Lecture seule — colonne Weekly_phase.Coach absente."
                    }
                    nativeInputProps={{
                      id: coachFieldId,
                      value: draftCoach,
                      disabled: busy || !opsReady,
                      onChange: (e) => setDraftCoach(e.target.value),
                      autoComplete: "name",
                    }}
                  />

                  <Input
                    className="fr-mt-2w"
                    label="Note de suivi (ops)"
                    hintText={
                      opsReady
                        ? "Markdown léger — reste sur Weekly, pas sur la fiche mission."
                        : "Lecture seule — colonne Weekly_phase.Note_ops absente."
                    }
                    textArea
                    nativeTextAreaProps={{
                      id: noteFieldId,
                      value: draftNote,
                      disabled: busy || !opsReady,
                      onChange: (e) => setDraftNote(e.target.value),
                      rows: 5,
                    }}
                  />

                  {writeError ? (
                    <Alert
                      className="fr-mt-2w"
                      severity="error"
                      small
                      title="Enregistrement impossible"
                      description={writeError}
                    />
                  ) : null}

                  <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-mt-3w">
                    <li>
                      <Button type="submit" disabled={busy}>
                        {opsReady ? "Enregistrer" : "Enregistrer la phase"}
                      </Button>
                    </li>
                    <li>
                      <Button
                        type="button"
                        priority="secondary"
                        onClick={close}
                        disabled={busy}
                      >
                        Fermer
                      </Button>
                    </li>
                  </ul>
                </form>
              )}

              <section className="fr-mt-4w" aria-labelledby={`${titleId}-echanges`}>
                <div
                  className="fr-mb-1w"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h3 id={`${titleId}-echanges`} className="fr-h6 fr-mb-0">
                    Derniers échanges
                  </h3>
                  {card != null ? (
                    <Button
                      type="button"
                      priority="tertiary no outline"
                      size="small"
                      iconId="fr-icon-add-line"
                      disabled={busy}
                      onClick={() => onNouveauSujet(card.missionId)}
                    >
                      Nouveau sujet
                    </Button>
                  ) : null}
                </div>
                <p className="fr-hint-text fr-mb-2w">
                  Sujets Weekly liés à cette mission (table agenda).
                </p>
                {agendaLies.length === 0 ? (
                  <p
                    className="fr-text--sm"
                    style={{ color: "var(--text-mention-grey)" }}
                  >
                    Aucun sujet lié pour l’instant.
                  </p>
                ) : (
                  <ul
                    className="fr-raw-list"
                    style={{
                      margin: 0,
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    {agendaLies.map((sujet) => {
                      const titre = (sujet.Texte ?? "Sujet").trim();
                      const auteur = weeklyAgendaAuteurPrenom(sujet.Auteur);
                      const createdAt = parseWeeklyAgendaCreatedAt(sujet.Cree_le);
                      const createdLabel = formatWeeklyAgendaCreatedAt(sujet.Cree_le);
                      return (
                        <li
                          key={sujet.id}
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.35rem 0.75rem",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            padding: "0.45rem 0",
                            borderTop: "1px solid var(--border-default-grey)",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p
                              className="fr-text--sm fr-mb-0"
                              style={{
                                fontWeight: 500,
                                textDecoration: sujet.Traite
                                  ? "line-through"
                                  : undefined,
                              }}
                            >
                              {titre}
                            </p>
                            <p
                              className="fr-text--xs fr-mb-0"
                              style={{ color: "var(--text-mention-grey)" }}
                            >
                              {auteur}
                              {createdLabel && createdAt ? (
                                <>
                                  {" "}
                                  <span aria-hidden="true">·</span>{" "}
                                  <time dateTime={createdAt.toISOString()}>
                                    {createdLabel}
                                  </time>
                                </>
                              ) : null}
                            </p>
                          </div>
                          <Button
                            type="button"
                            priority="tertiary no outline"
                            size="small"
                            iconId="fr-icon-eye-line"
                            disabled={busy}
                            onClick={() => onViewSujet(sujet)}
                          >
                            Voir
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {card != null ? (
                <p
                  className="fr-mt-4w fr-pt-2w"
                  style={{ borderTop: "1px dashed var(--border-default-grey)" }}
                >
                  <Link
                    className="fr-link fr-link--sm"
                    to={`/missions/${card.missionId}`}
                    onClick={close}
                  >
                    Ouvrir la fiche mission
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
