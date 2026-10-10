/**
 * Drawer « Suivi mission » Weekly Ops V1 — satellite `Weekly_phase` + échanges
 * `Weekly_agenda`. Aucune écriture `Missions`.
 * Ouverture en lecture ; note = édition sur place (pattern contexte mission) ;
 * météo / membres = bouton « Modifier ».
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Link } from "react-router-dom";
import { DsfrSelectRichMulti } from "../dsfr/DsfrSelectRichMulti";
import { MissionProse } from "../missions/MissionProse";
import { WeeklyLinkedActionsSection } from "./WeeklyLinkedActionsSection";
import type { WeeklyActionRow, WeeklyAgendaRow } from "../../types";
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
  weeklyMeteoIconClass,
  weeklyMeteoLabel,
  weeklyMeteoTone,
  type WeeklyCard,
  type WeeklyPhaseKey,
} from "../../utils/weeklyPhases";

const MARKDOWN_HINT =
  "Markdown Grist : titres (#), listes (- ou *), liens [libellé](url), gras **texte**, code `…` ou ```";

/** Plafond UX select multi porteurs (RefList Grist sans limite dure). */
const MEMBRE_EQUIPE_MAX_SELECTIONS = 5;

export type WeeklyEquipeOption = { id: number; label: string };

export type WeeklySuiviDrawerProps = {
  open: boolean;
  card: WeeklyCard | null;
  agendaLies: readonly WeeklyAgendaRow[];
  /** Actions déjà liées à la mission (`Weekly_action.Mission`). */
  actionsLies?: readonly WeeklyActionRow[];
  /** Personnes Ops (`Equipe` ∩ `Weekly_coachs`) pour le select Membre_equipe. */
  equipeOptions: readonly WeeklyEquipeOption[];
  busy: boolean;
  onClose: () => void;
  onSaveSuivi: (input: {
    missionId: number;
    phaseRowId: number | null;
    phase: WeeklyPhaseKey;
    meteo: string;
    noteOps: string;
    membreEquipeIds: number[];
  }) => Promise<void>;
  onViewSujet: (sujet: WeeklyAgendaRow) => void;
  onNouveauSujet: (missionId: number) => void;
  /** Ouvre le dialogue Créer | Rattacher pour cette mission. */
  onLierAction?: (missionId: number, missionLabel: string) => void;
  /** Ouvre l’édition d’une action liée (onglet Actions / drawer). */
  onViewAction?: (action: WeeklyActionRow) => void;
};

function parseMembreIds(values: readonly string[]): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const raw of values) {
    const mid = Number(raw);
    if (!Number.isFinite(mid) || mid <= 0 || seen.has(mid)) continue;
    seen.add(mid);
    out.push(mid);
  }
  return out;
}

function draftFromCard(card: WeeklyCard): string[] {
  return card.membreEquipeIds
    .filter((id) => id > 0)
    .map((id) => String(id));
}

export function WeeklySuiviDrawer({
  open,
  card,
  agendaLies,
  actionsLies = [],
  equipeOptions,
  busy,
  onClose,
  onSaveSuivi,
  onViewSujet,
  onNouveauSujet,
  onLierAction,
  onViewAction,
}: WeeklySuiviDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const meteoFieldId = useId();
  const noteFieldId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [editingMeta, setEditingMeta] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [draftMeteo, setDraftMeteo] = useState("");
  const [draftMembreIds, setDraftMembreIds] = useState<string[]>([]);
  const [draftNote, setDraftNote] = useState("");
  const [writeError, setWriteError] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  /** Reset modes lecture à chaque ouverture / changement de mission. */
  useEffect(() => {
    if (!open || card == null) return;
    setEditingMeta(false);
    setEditingNote(false);
    setDraftMeteo(normalizeWeeklyMeteo(card.meteo));
    setDraftMembreIds(draftFromCard(card));
    setDraftNote(card.noteOps);
    setWriteError(null);
    setSavingMeta(false);
    setSavingNote(false);
  }, [open, card?.missionId]);

  /** Sync drafts depuis la carte quand on n’édite pas (après reload). */
  useEffect(() => {
    if (!open || card == null) return;
    if (!editingMeta) {
      setDraftMeteo(normalizeWeeklyMeteo(card.meteo));
      setDraftMembreIds(draftFromCard(card));
    }
    if (!editingNote) {
      setDraftNote(card.noteOps);
    }
  }, [
    open,
    card,
    card?.meteo,
    card?.membreEquipeIds,
    card?.noteOps,
    editingMeta,
    editingNote,
  ]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const close = () => {
    if (busy || savingMeta || savingNote) return;
    dialogRef.current?.close();
  };

  const phaseMeta = card
    ? WEEKLY_PHASES.find((p) => p.key === card.phase)
    : undefined;

  const opsReady = WEEKLY_PHASE_OPS_COLUMNS_READY;

  const membreSelectOptions = useMemo(() => {
    const list = [...equipeOptions];
    const assigned = card?.membresEquipe ?? [];
    for (const m of assigned) {
      if (m.id > 0 && !list.some((o) => o.id === m.id)) {
        list.unshift({
          id: m.id,
          label: m.label || `Personne #${m.id}`,
        });
      }
    }
    return list
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, "fr"))
      .map((p) => ({ value: String(p.id), label: p.label }));
  }, [equipeOptions, card?.membresEquipe]);

  const membreReadLabel =
    card?.membresEquipe
      .map((m) => m.label.trim())
      .filter(Boolean)
      .join(", ") ?? "";

  const meteoNormalized = card ? normalizeWeeklyMeteo(card.meteo) : "";
  const meteoTone = meteoNormalized ? weeklyMeteoTone(meteoNormalized) : null;
  const hasNote = Boolean(card?.noteOps.trim());

  const startEditMeta = () => {
    if (!card || !opsReady || busy) return;
    setDraftMeteo(normalizeWeeklyMeteo(card.meteo));
    setDraftMembreIds(draftFromCard(card));
    setWriteError(null);
    setEditingMeta(true);
  };

  const cancelEditMeta = () => {
    if (savingMeta) return;
    if (card) {
      setDraftMeteo(normalizeWeeklyMeteo(card.meteo));
      setDraftMembreIds(draftFromCard(card));
    }
    setWriteError(null);
    setEditingMeta(false);
  };

  const saveMeta = async () => {
    if (card == null || savingMeta) return;
    setSavingMeta(true);
    setWriteError(null);
    try {
      await onSaveSuivi({
        missionId: card.missionId,
        phaseRowId: card.phaseRowId,
        phase: card.phase,
        meteo: draftMeteo,
        noteOps: card.noteOps,
        membreEquipeIds: parseMembreIds(draftMembreIds),
      });
      setEditingMeta(false);
    } catch (err) {
      setWriteError(
        err instanceof Error ? err.message : "Impossible d’enregistrer le suivi.",
      );
    } finally {
      setSavingMeta(false);
    }
  };

  const startEditNote = () => {
    if (!card || !opsReady || busy) return;
    setDraftNote(card.noteOps);
    setWriteError(null);
    setEditingNote(true);
  };

  const cancelEditNote = () => {
    if (savingNote) return;
    setDraftNote(card?.noteOps ?? "");
    setWriteError(null);
    setEditingNote(false);
  };

  const saveNote = async () => {
    if (card == null || savingNote) return;
    setSavingNote(true);
    setWriteError(null);
    try {
      await onSaveSuivi({
        missionId: card.missionId,
        phaseRowId: card.phaseRowId,
        phase: card.phase,
        meteo: normalizeWeeklyMeteo(card.meteo),
        noteOps: draftNote,
        membreEquipeIds: card.membreEquipeIds,
      });
      setEditingNote(false);
    } catch (err) {
      setWriteError(
        err instanceof Error ? err.message : "Impossible d’enregistrer la note.",
      );
    } finally {
      setSavingNote(false);
    }
  };

  const locked = busy || savingMeta || savingNote;

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
            if (!locked) close();
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
                    ref={closeBtnRef}
                    type="button"
                    className="fr-btn--close fr-btn"
                    title="Fermer"
                    onClick={close}
                    disabled={locked}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </header>

            <div className="pilotage-drawer-dialog__body fr-px-3w fr-pb-3w fr-pt-0">
              {card == null ? null : (
                <>
                  {phaseMeta ? (
                    <p className="fr-badge fr-badge--info fr-badge--no-icon fr-mb-2w">
                      {phaseMeta.label}
                      <span className="fr-sr-only">
                        {" "}
                        (phase = colonne kanban)
                      </span>
                    </p>
                  ) : null}

                  {/* ——— Météo + Membres (lecture / édition) ——— */}
                  <section
                    className="weekly-suivi-meta"
                    aria-labelledby={`${titleId}-meta`}
                  >
                    <div className="weekly-suivi-meta__header">
                      <h3 id={`${titleId}-meta`} className="fr-h6 fr-mb-0">
                        Suivi ops
                      </h3>
                      {!editingMeta ? (
                        <button
                          type="button"
                          className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
                          onClick={startEditMeta}
                          disabled={locked || !opsReady || editingNote}
                        >
                          Modifier
                        </button>
                      ) : null}
                    </div>

                    {editingMeta ? (
                      <div className="fr-mt-2w">
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
                                disabled={locked || !opsReady}
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

                        <div className="fr-mt-2w">
                          <DsfrSelectRichMulti
                            label="Membres équipe"
                            hintText="Un ou plusieurs porteurs Ops (coachs Weekly)."
                            placeholderWhenEmpty="Rechercher une personne…"
                            options={membreSelectOptions}
                            selectedValues={draftMembreIds}
                            onSelectedValuesChange={setDraftMembreIds}
                            searchable
                            searchLabel="Rechercher"
                            searchPlaceholder="Nom…"
                            showBulkActions={false}
                            maxSelections={MEMBRE_EQUIPE_MAX_SELECTIONS}
                            pluralEntityLabel="personnes"
                            disabled={locked || !opsReady}
                          />
                        </div>

                        {writeError && editingMeta ? (
                          <Alert
                            className="fr-mt-2w"
                            severity="error"
                            small
                            title="Enregistrement impossible"
                            description={writeError}
                          />
                        ) : null}

                        <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-mt-2w">
                          <li>
                            <Button
                              type="button"
                              disabled={locked}
                              onClick={() => void saveMeta()}
                            >
                              Enregistrer
                            </Button>
                          </li>
                          <li>
                            <Button
                              type="button"
                              priority="secondary"
                              disabled={locked}
                              onClick={cancelEditMeta}
                            >
                              Annuler
                            </Button>
                          </li>
                        </ul>
                      </div>
                    ) : (
                      <dl className="weekly-suivi-meta__read fr-mt-2w">
                        <div>
                          <dt>Météo</dt>
                          <dd>
                            {meteoNormalized && meteoTone ? (
                              <span
                                className={`weekly-suivi-meteo-read weekly-suivi-meteo-read--${meteoTone}`}
                              >
                                <span
                                  className={`${weeklyMeteoIconClass(meteoNormalized)} fr-icon--sm`}
                                  aria-hidden="true"
                                />
                                {weeklyMeteoLabel(meteoNormalized)}
                              </span>
                            ) : (
                              <span className="fr-text-mention--grey">
                                Non renseignée
                              </span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>Membres équipe</dt>
                          <dd>
                            {membreReadLabel ? (
                              membreReadLabel
                            ) : (
                              <span className="fr-text-mention--grey">
                                Non assigné
                              </span>
                            )}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </section>

                  {/* ——— Note (pattern contexte / note studio) ——— */}
                  <section
                    className="weekly-suivi-note fr-mt-4w"
                    aria-labelledby={`${titleId}-note`}
                  >
                    <div className="weekly-suivi-note__header">
                      <h3 id={`${titleId}-note`} className="fr-h6 fr-mb-0">
                        Note de suivi (ops)
                      </h3>
                      {!editingNote ? (
                        <button
                          type="button"
                          className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
                          onClick={startEditNote}
                          disabled={locked || !opsReady || editingMeta}
                        >
                          {hasNote ? "Modifier" : "Ajouter"}
                        </button>
                      ) : null}
                    </div>

                    {editingNote ? (
                      <div className="weekly-suivi-note__edit fr-mt-2w">
                        <Input
                          label="Note de suivi (ops)"
                          hintText={MARKDOWN_HINT}
                          textArea
                          nativeTextAreaProps={{
                            id: noteFieldId,
                            value: draftNote,
                            rows: 8,
                            disabled: locked || !opsReady,
                            onChange: (e) => setDraftNote(e.target.value),
                          }}
                        />
                        {writeError && editingNote ? (
                          <Alert
                            className="fr-mb-2w"
                            severity="error"
                            small
                            title="Enregistrement impossible"
                            description={writeError}
                          />
                        ) : null}
                        <div className="weekly-suivi-note__actions">
                          <button
                            type="button"
                            className="fr-btn fr-btn--sm fr-icon-check-line"
                            onClick={() => void saveNote()}
                            disabled={locked}
                            title={savingNote ? "Enregistrement…" : "Enregistrer"}
                            aria-label={
                              savingNote ? "Enregistrement…" : "Enregistrer"
                            }
                          />
                          <button
                            type="button"
                            className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-close-line"
                            onClick={cancelEditNote}
                            disabled={locked}
                            title="Annuler"
                            aria-label="Annuler"
                          />
                        </div>
                      </div>
                    ) : hasNote ? (
                      <div className="fr-mt-2w">
                        <MissionProse value={card.noteOps} />
                      </div>
                    ) : (
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-2w">
                        Aucune note — utilisez « Ajouter » pour renseigner ce
                        champ.
                      </p>
                    )}
                  </section>

                  <WeeklyLinkedActionsSection
                    titleId={titleId}
                    actions={actionsLies}
                    hint="Actions Ops rattachées à cette mission."
                    locked={locked}
                    onLier={
                      onLierAction
                        ? () => onLierAction(card.missionId, card.titre)
                        : undefined
                    }
                    onViewAction={onViewAction}
                  />

                  <section
                    className="fr-mt-4w"
                    aria-labelledby={`${titleId}-echanges`}
                  >
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
                      <Button
                        type="button"
                        priority="tertiary no outline"
                        size="small"
                        iconId="fr-icon-add-line"
                        disabled={locked}
                        onClick={() => onNouveauSujet(card.missionId)}
                      >
                        Nouveau sujet
                      </Button>
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
                          const createdAt = parseWeeklyAgendaCreatedAt(
                            sujet.Cree_le,
                          );
                          const createdLabel = formatWeeklyAgendaCreatedAt(
                            sujet.Cree_le,
                          );
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
                                borderTop:
                                  "1px solid var(--border-default-grey)",
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
                                disabled={locked}
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

                  <p
                    className="fr-mt-4w fr-pt-2w"
                    style={{
                      borderTop: "1px dashed var(--border-default-grey)",
                    }}
                  >
                    <Link
                      className="fr-link fr-link--sm"
                      to={`/missions/${card.missionId}`}
                      onClick={close}
                    >
                      Ouvrir la fiche mission
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
