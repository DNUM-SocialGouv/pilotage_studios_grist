/**
 * Drawer « Suivi mission » Weekly Ops V1 — satellite `Weekly_phase` + échanges
 * `Weekly_agenda`. Aucune écriture `Missions`.
 * Phase = colonne kanban (badge lecture) — pas de select Phase redondant.
 */

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Link } from "react-router-dom";
import { DsfrSelectRichMulti } from "../dsfr/DsfrSelectRichMulti";
import type { WeeklyAgendaRow } from "../../types";
import {
  formatWeeklyAgendaCreatedAt,
  parseWeeklyAgendaCreatedAt,
  weeklyAgendaAuteurPrenom,
} from "../../utils/weeklyAgenda";
import {
  WEEKLY_METEO_OPTIONS,
  WEEKLY_PHASES,
  WEEKLY_PHASE_OPS_COLUMNS_READY,
  normalizeWeeklyMeteo,
  type WeeklyCard,
  type WeeklyPhaseKey,
} from "../../utils/weeklyPhases";

export type WeeklyEquipeOption = { id: number; label: string };

export type WeeklySuiviDrawerProps = {
  open: boolean;
  card: WeeklyCard | null;
  agendaLies: readonly WeeklyAgendaRow[];
  /** Personnes `Equipe` pour le select Membre_equipe. */
  equipeOptions: readonly WeeklyEquipeOption[];
  busy: boolean;
  onClose: () => void;
  onSaveSuivi: (input: {
    missionId: number;
    phaseRowId: number | null;
    phase: WeeklyPhaseKey;
    meteo: string;
    noteOps: string;
    membreEquipeId: number | null;
  }) => Promise<void>;
  onViewSujet: (sujet: WeeklyAgendaRow) => void;
  onNouveauSujet: (missionId: number) => void;
};

export function WeeklySuiviDrawer({
  open,
  card,
  agendaLies,
  equipeOptions,
  busy,
  onClose,
  onSaveSuivi,
  onViewSujet,
  onNouveauSujet,
}: WeeklySuiviDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const meteoFieldId = useId();
  const noteFieldId = useId();

  const [draftMeteo, setDraftMeteo] = useState("");
  const [draftMembreId, setDraftMembreId] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [writeError, setWriteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || card == null) return;
    setDraftMeteo(normalizeWeeklyMeteo(card.meteo));
    setDraftMembreId(
      card.membreEquipeId != null && card.membreEquipeId > 0
        ? String(card.membreEquipeId)
        : "",
    );
    setDraftNote(card.noteOps);
    setWriteError(null);
  }, [
    open,
    card,
    card?.missionId,
    card?.phase,
    card?.meteo,
    card?.membreEquipeId,
    card?.noteOps,
  ]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        const firstMeteo = dialog.querySelector<HTMLButtonElement>(
          ".weekly-meteo-btn:not(:disabled)",
        );
        firstMeteo?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const close = () => {
    dialogRef.current?.close();
  };

  const phaseMeta = card
    ? WEEKLY_PHASES.find((p) => p.key === card.phase)
    : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (card == null) return;
    setWriteError(null);
    const mid = draftMembreId ? Number(draftMembreId) : null;
    try {
      await onSaveSuivi({
        missionId: card.missionId,
        phaseRowId: card.phaseRowId,
        // Phase = colonne kanban ; pas de select drawer.
        phase: card.phase,
        meteo: draftMeteo,
        noteOps: draftNote,
        membreEquipeId:
          mid != null && Number.isFinite(mid) && mid > 0 ? mid : null,
      });
    } catch (err) {
      setWriteError(
        err instanceof Error ? err.message : "Impossible d’enregistrer le suivi.",
      );
    }
  };

  const opsReady = WEEKLY_PHASE_OPS_COLUMNS_READY;

  /** Options select searchable : liste + valeur courante absente (id orphelin). */
  const membreSelectOptions = useMemo(() => {
    const list = [...equipeOptions];
    if (
      card?.membreEquipeId != null &&
      card.membreEquipeId > 0 &&
      !list.some((o) => o.id === card.membreEquipeId)
    ) {
      list.unshift({
        id: card.membreEquipeId,
        label:
          card.membreEquipeLabel ||
          `Personne #${card.membreEquipeId}`,
      });
    }
    return list
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, "fr"))
      .map((p) => ({ value: String(p.id), label: p.label }));
  }, [equipeOptions, card?.membreEquipeId, card?.membreEquipeLabel]);

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
                      <span className="fr-sr-only">
                        {" "}
                        (phase = colonne kanban)
                      </span>
                    </p>
                  ) : null}

                  <div>
                    <p
                      id={meteoFieldId}
                      className="fr-label"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      Météo
                    </p>
                    <div
                      className="weekly-meteo-group"
                      role="radiogroup"
                      aria-labelledby={meteoFieldId}
                    >
                      {WEEKLY_METEO_OPTIONS.map((opt) => {
                        const checked = draftMeteo === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            className={`weekly-meteo-btn weekly-meteo-btn--${opt.tone}`}
                            disabled={busy || !opsReady}
                            onClick={() =>
                              setDraftMeteo(checked ? "" : opt.value)
                            }
                          >
                            <span
                              className={`${opt.iconClass} weekly-meteo-btn__icon`}
                              aria-hidden="true"
                            />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="fr-mt-2w">
                    <DsfrSelectRichMulti
                      label="Membre équipe"
                      placeholderWhenEmpty="Rechercher une personne…"
                      options={membreSelectOptions}
                      selectedValues={draftMembreId ? [draftMembreId] : []}
                      onSelectedValuesChange={(values) =>
                        setDraftMembreId(values[0] ?? "")
                      }
                      searchable
                      searchLabel="Rechercher"
                      searchPlaceholder="Nom…"
                      showBulkActions={false}
                      maxSelections={1}
                      pluralEntityLabel="personnes"
                      disabled={busy || !opsReady}
                    />
                  </div>

                  <Input
                    className="fr-mt-2w"
                    label="Note de suivi (ops)"
                    hintText="Markdown"
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
                        Enregistrer
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
                  Sujets Weekly liés à cette mission.
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
