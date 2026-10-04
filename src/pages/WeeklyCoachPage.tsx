import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Link } from "react-router-dom";
import { useAclProfil } from "../AclProfilContext";
import { useGristPa } from "../GristPaContext";
import { useWeeklyCoachData } from "../hooks/useWeeklyCoachData";
import { NothingHerePage } from "../security/NothingHerePage";
import { extractGristReferenceId } from "../utils/gristReferences";
import {
  defaultWeeklyAuteurPrenom,
  formatWeeklyAgendaCreatedAt,
  parseWeeklyAgendaCreatedAt,
} from "../utils/weeklyAgenda";
import {
  createWeeklyAgendaRecord,
  updateWeeklyAgendaTexte,
  updateWeeklyAgendaTraite,
  upsertWeeklyPhase,
} from "../utils/weeklyGristWrite";
import {
  WEEKLY_PHASES,
  buildWeeklyCards,
  groupCardsByPhase,
  isWeeklyPhaseKey,
  phaseRowsToMap,
  type WeeklyCard,
  type WeeklyPhaseKey,
} from "../utils/weeklyPhases";
import type { WeeklyAgendaRow } from "../types";

type AgendaDialogMode = "view" | "edit";

function AgendaSujetRow({
  sujet,
  missionLabel,
  missionId,
  busy,
  onToggle,
  onView,
  onEdit,
}: {
  sujet: WeeklyAgendaRow;
  missionLabel?: string;
  missionId: number | null;
  busy: boolean;
  onToggle: (id: number, traite: boolean) => void;
  onView: (sujet: WeeklyAgendaRow) => void;
  onEdit: (sujet: WeeklyAgendaRow) => void;
}) {
  const checkId = `weekly-agenda-${sujet.id}`;
  const titleId = `${checkId}-title`;
  const traite = Boolean(sujet.Traite);
  const texte = (sujet.Texte ?? "Sujet").trim();
  const auteur = (sujet.Auteur || "—").trim();
  const createdAt = parseWeeklyAgendaCreatedAt(sujet.Cree_le);
  const createdLabel = formatWeeklyAgendaCreatedAt(sujet.Cree_le);

  return (
    <article
      style={{
        background: "var(--background-default-grey)",
        boxShadow: "inset 0 0 0 1px var(--border-default-grey)",
        padding: "0.625rem 0.75rem",
        display: "grid",
        gridTemplateColumns: "1.25rem minmax(0, 1fr) auto",
        gap: "0.75rem",
        alignItems: "start",
      }}
    >
      <div className="fr-checkbox-group fr-checkbox-group--sm" style={{ margin: 0 }}>
        <input
          type="checkbox"
          id={checkId}
          checked={traite}
          disabled={busy}
          aria-labelledby={titleId}
          onChange={(ev) => onToggle(sujet.id, ev.currentTarget.checked)}
        />
        <label className="fr-label" htmlFor={checkId}>
          <span className="fr-sr-only">Sujet traité</span>
        </label>
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          id={titleId}
          className="fr-text--sm"
          style={{
            margin: 0,
            fontWeight: 500,
            textDecoration: traite ? "line-through" : undefined,
            color: traite ? "var(--text-mention-grey)" : undefined,
          }}
        >
          {texte}
        </p>
        <p
          className="fr-text--xs"
          style={{
            margin: "0.125rem 0 0",
            color: "var(--text-mention-grey)",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.25rem 0.5rem",
            alignItems: "center",
          }}
        >
          <span>Proposé par {auteur}</span>
          {createdLabel && createdAt ? (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={createdAt.toISOString()}>Créé le {createdLabel}</time>
            </>
          ) : null}
          {missionId != null && missionLabel ? (
            <>
              <span aria-hidden="true">·</span>
              <Link
                className="fr-link fr-link--sm fr-icon-team-line fr-link--icon-left"
                to={`/missions/${missionId}`}
              >
                {missionLabel}
              </Link>
            </>
          ) : null}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.25rem",
          justifyContent: "flex-end",
        }}
      >
        <Button
          type="button"
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-eye-line"
          disabled={busy}
          onClick={() => onView(sujet)}
          title={`Voir le sujet : ${texte}`}
        >
          Voir
        </Button>
        <Button
          type="button"
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-edit-line"
          disabled={busy}
          onClick={() => onEdit(sujet)}
          title={`Modifier le sujet : ${texte}`}
        >
          Modifier
        </Button>
      </div>
    </article>
  );
}

function AgendaSujetDialog({
  sujet,
  mode,
  missionLabel,
  busy,
  onClose,
  onSave,
  onSwitchToEdit,
}: {
  sujet: WeeklyAgendaRow | null;
  mode: AgendaDialogMode;
  missionLabel?: string;
  busy: boolean;
  onClose: () => void;
  onSave: (id: number, texte: string) => Promise<void>;
  onSwitchToEdit: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const fieldId = useId();
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setDraft((sujet?.Texte ?? "").trim());
    setLocalError(null);
  }, [sujet?.id, sujet?.Texte, mode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (sujet != null) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [sujet]);

  const createdLabel = formatWeeklyAgendaCreatedAt(sujet?.Cree_le);
  const auteur = (sujet?.Auteur || "—").trim();

  const close = () => {
    dialogRef.current?.close();
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (sujet == null) return;
    const next = draft.trim();
    if (!next) {
      setLocalError("Saisissez un sujet.");
      return;
    }
    setLocalError(null);
    await onSave(sujet.id, next);
  };

  return (
    <dialog
      ref={dialogRef}
      className="fr-modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="fr-container fr-container--fluid fr-container-md">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button
                  type="button"
                  className="fr-btn--close fr-btn"
                  onClick={close}
                  disabled={busy}
                >
                  Fermer
                </button>
              </div>
              <div className="fr-modal__content">
                <h2 id={titleId} className="fr-modal__title">
                  {mode === "edit" ? "Modifier le sujet" : "Sujet à aborder"}
                </h2>
                {sujet == null ? null : mode === "view" ? (
                  <>
                    <p
                      className="fr-text--md"
                      style={{ whiteSpace: "pre-wrap", marginBottom: "0.75rem" }}
                    >
                      {(sujet.Texte ?? "").trim() || "—"}
                    </p>
                    <p className="fr-text--xs" style={{ color: "var(--text-mention-grey)" }}>
                      Proposé par {auteur}
                      {createdLabel ? ` · Créé le ${createdLabel}` : ""}
                      {missionLabel ? ` · ${missionLabel}` : ""}
                    </p>
                  </>
                ) : (
                  <form ref={formRef} onSubmit={(e) => void submitEdit(e)}>
                    <Input
                      label="Contenu du sujet"
                      hintText="Modifie uniquement le texte ; auteur et date restent inchangés."
                      textArea
                      state={localError ? "error" : "default"}
                      stateRelatedMessage={localError ?? undefined}
                      nativeTextAreaProps={{
                        id: fieldId,
                        value: draft,
                        onChange: (e) => setDraft(e.target.value),
                        disabled: busy,
                        rows: 5,
                        "aria-required": true,
                      }}
                    />
                  </form>
                )}
              </div>
              <div className="fr-modal__footer">
                <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
                  {mode === "view" ? (
                    <>
                      <li>
                        <Button type="button" onClick={onSwitchToEdit} disabled={busy}>
                          Modifier
                        </Button>
                      </li>
                      <li>
                        <Button type="button" priority="secondary" onClick={close} disabled={busy}>
                          Fermer
                        </Button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Button
                          type="button"
                          disabled={busy}
                          onClick={() => formRef.current?.requestSubmit()}
                        >
                          Enregistrer
                        </Button>
                      </li>
                      <li>
                        <Button type="button" priority="secondary" onClick={close} disabled={busy}>
                          Annuler
                        </Button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function meteoIconClass(meteo: string): string {
  const t = meteo.toLowerCase();
  if (
    t.includes("orage") ||
    t.includes("difficul") ||
    t.includes("rouge") ||
    t.includes("bloq")
  ) {
    return "fr-icon-thunderstorms-line";
  }
  if (
    t.includes("nuage") ||
    t.includes("surveill") ||
    t.includes("orange") ||
    t.includes("attention")
  ) {
    return "fr-icon-cloudy-2-line";
  }
  if (t.includes("vert") || t.includes("beau") || t.includes("soleil") || t.includes("ok")) {
    return "fr-icon-sun-line";
  }
  return "fr-icon-cloudy-2-line";
}

function WeeklyCardView({
  card,
  busy,
  onPhaseChange,
  onDragStart,
  onDragEnd,
}: {
  card: WeeklyCard;
  busy: boolean;
  onPhaseChange: (missionId: number, phase: WeeklyPhaseKey) => void;
  onDragStart: (missionId: number) => void;
  onDragEnd: () => void;
}) {
  const phaseId = `phase-${card.missionId}`;
  const hasMeteo = Boolean(card.meteo);
  const assignee =
    card.intervenants.length > 0 ? card.intervenants.join(", ") : "À assigner";

  return (
    <article
      draggable={!busy}
      onDragStart={() => onDragStart(card.missionId)}
      onDragEnd={onDragEnd}
      aria-label={card.titre}
      style={{
        background: "var(--background-default-grey)",
        boxShadow: "inset 0 0 0 1px var(--border-default-grey)",
        padding: "0.75rem",
        marginBottom: "0.625rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        cursor: busy ? "default" : "grab",
      }}
    >
      <h3
        className="fr-text--md"
        style={{
          margin: 0,
          fontSize: "0.9375rem",
          lineHeight: "1.375rem",
          fontWeight: 700,
        }}
      >
        {card.titre}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.375rem 0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {card.produitLabel ? (
          <p
            className="fr-text--xs"
            style={{
              margin: 0,
              color: "var(--text-mention-grey)",
              display: "inline-flex",
              gap: "0.25rem",
              alignItems: "center",
            }}
          >
            <span className="fr-icon-dashboard-3-line fr-icon--sm" aria-hidden="true" />
            {card.produitLabel}
          </p>
        ) : (
          <span />
        )}
        {hasMeteo ? (
          <span
            className={`${meteoIconClass(card.meteo)} fr-icon--sm`}
            title={`Météo : ${card.meteo}`}
            aria-label={`Météo : ${card.meteo}`}
            style={{ color: "var(--text-default-grey)" }}
          />
        ) : null}
      </div>

      <ul
        className="fr-tags-group fr-tags-group--sm"
        style={{ margin: 0 }}
      >
        {card.departements.map((dep) => (
          <li key={dep}>
            <p className="fr-tag fr-tag--sm">{dep}</p>
          </li>
        ))}
        <li>
          <p
            className="fr-tag fr-tag--sm fr-icon-user-line fr-tag--icon-left"
            style={
              card.intervenants.length === 0
                ? { color: "var(--text-default-warning)" }
                : undefined
            }
          >
            {assignee}
          </p>
        </li>
      </ul>

      {card.statut ? (
        <p
          className="fr-text--xs"
          style={{
            margin: 0,
            paddingTop: "0.375rem",
            borderTop: "1px solid var(--border-default-grey)",
            color: "var(--text-mention-grey)",
          }}
        >
          Statut Grist : {card.statut}
        </p>
      ) : null}

      <div className="fr-select-group" style={{ marginBottom: 0 }}>
        <label className="fr-label fr-sr-only" htmlFor={phaseId}>
          Phase de {card.titre}
        </label>
        <select
          className="fr-select"
          id={phaseId}
          disabled={busy}
          value={card.phase}
          onChange={(e) => {
            const next = e.target.value;
            if (!isWeeklyPhaseKey(next)) return;
            onPhaseChange(card.missionId, next);
          }}
        >
          {WEEKLY_PHASES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <Link
        className="fr-link fr-link--sm"
        to={`/missions/${card.missionId}`}
      >
        Ouvrir la fiche mission
      </Link>
    </article>
  );
}

export function WeeklyCoachPage() {
  const pa = useGristPa();
  const { email: sessionEmail, displayName } = useAclProfil();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useWeeklyCoachData(enabled);

  const [dragMissionId, setDragMissionId] = useState<number | null>(null);
  const [busyMissionId, setBusyMissionId] = useState<number | null>(null);
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [agendaBusy, setAgendaBusy] = useState(false);
  const [newSujet, setNewSujet] = useState("");
  const [newMissionId, setNewMissionId] = useState("");
  const [auteur, setAuteur] = useState("");
  const [dialogSujet, setDialogSujet] = useState<WeeklyAgendaRow | null>(null);
  const [dialogMode, setDialogMode] = useState<AgendaDialogMode>("view");

  useEffect(() => {
    const next = defaultWeeklyAuteurPrenom(displayName, sessionEmail);
    setAuteur((prev) => prev.trim() || next);
  }, [displayName, sessionEmail]);

  const cards = useMemo(
    () =>
      buildWeeklyCards({
        missions: data.missions,
        missionEnfants: data.missionEnfants,
        intervenants: data.intervenants,
        produits: data.produits,
        phaseRows: data.phases,
      }),
    [
      data.missions,
      data.missionEnfants,
      data.intervenants,
      data.produits,
      data.phases,
    ],
  );

  const byPhase = useMemo(() => groupCardsByPhase(cards), [cards]);

  const agendaSorted = useMemo(() => {
    return [...data.agenda].sort((a, b) => {
      if (Boolean(a.Traite) !== Boolean(b.Traite)) {
        return a.Traite ? 1 : -1;
      }
      return a.id - b.id;
    });
  }, [data.agenda]);

  const missionTitleById = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of cards) {
      m.set(c.missionId, c.titre);
    }
    return m;
  }, [cards]);

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  const changePhase = async (missionId: number, phase: WeeklyPhaseKey) => {
    const card = cards.find((c) => c.missionId === missionId);
    if (!card || card.phase === phase) return;
    // Réutilise une ligne existante (y compris après course create) avant un create.
    const existingPhaseId =
      card.phaseRowId ?? phaseRowsToMap(data.phases).get(missionId)?.phaseId ?? null;
    setPhaseError(null);
    setBusyMissionId(missionId);
    try {
      await upsertWeeklyPhase({
        phaseRowId: existingPhaseId,
        missionId,
        phase,
      });
      await data.reload();
    } catch (e) {
      setPhaseError(
        e instanceof Error ? e.message : "Impossible d’enregistrer la phase.",
      );
    } finally {
      setBusyMissionId(null);
      setDragMissionId(null);
    }
  };

  const onDropColumn = (phase: WeeklyPhaseKey) => (e: DragEvent) => {
    e.preventDefault();
    const missionId = dragMissionId;
    setDragMissionId(null);
    if (missionId == null) return;
    void changePhase(missionId, phase);
  };

  const onAddSujet = async (e: FormEvent) => {
    e.preventDefault();
    setAgendaError(null);
    const texte = newSujet.trim();
    if (!texte) {
      setAgendaError("Saisissez un sujet.");
      return;
    }
    const name =
      auteur.trim() ||
      defaultWeeklyAuteurPrenom(displayName, sessionEmail) ||
      "Anonyme";
    setAgendaBusy(true);
    try {
      const mid = newMissionId ? Number(newMissionId) : null;
      await createWeeklyAgendaRecord({
        texte,
        auteur: name,
        email: sessionEmail ?? "",
        missionId: mid != null && Number.isFinite(mid) ? mid : null,
      });
      setNewSujet("");
      setNewMissionId("");
      await data.reload();
    } catch (err) {
      setAgendaError(
        err instanceof Error ? err.message : "Impossible d’ajouter le sujet.",
      );
    } finally {
      setAgendaBusy(false);
    }
  };

  const onToggleTraite = async (id: number, traite: boolean) => {
    setAgendaError(null);
    setAgendaBusy(true);
    try {
      await updateWeeklyAgendaTraite(id, traite);
      await data.reload();
    } catch (err) {
      setAgendaError(
        err instanceof Error ? err.message : "Impossible de mettre à jour le sujet.",
      );
    } finally {
      setAgendaBusy(false);
    }
  };

  const openAgendaDialog = (sujet: WeeklyAgendaRow, mode: AgendaDialogMode) => {
    setDialogMode(mode);
    setDialogSujet(sujet);
  };

  const onSaveAgendaTexte = async (id: number, texte: string) => {
    setAgendaError(null);
    setAgendaBusy(true);
    try {
      await updateWeeklyAgendaTexte(id, texte);
      setDialogSujet(null);
      await data.reload();
    } catch (err) {
      setAgendaError(
        err instanceof Error ? err.message : "Impossible d’enregistrer le sujet.",
      );
    } finally {
      setAgendaBusy(false);
    }
  };

  const traiteCount = agendaSorted.filter((s) => s.Traite).length;

  return (
    <div>
      <h1 className="fr-h3 fr-mb-3w">Weekly Ops</h1>

      {pa.loading ? (
        <p className="fr-text--sm" role="status">
          Connexion au document Grist…
        </p>
      ) : null}

      {data.refsError ? (
        <Alert
          className="fr-mb-2w"
          severity="warning"
          small
          title="Données partielles"
          description={data.refsError}
        />
      ) : null}
      {phaseError ? (
        <Alert
          className="fr-mb-2w"
          severity="error"
          small
          title="Phase"
          description={phaseError}
        />
      ) : null}
      {agendaError ? (
        <Alert
          className="fr-mb-2w"
          severity="error"
          small
          title="Agenda"
          description={agendaError}
        />
      ) : null}

      {data.status === "loading" ? (
        <p className="fr-text--sm" role="status">
          Chargement des missions…
        </p>
      ) : null}
      {data.status === "error" ? (
        <Alert
          severity="error"
          title="Impossible de charger Weekly"
          description={data.error ?? "Erreur inconnue."}
        />
      ) : null}

      {data.status === "ok" ? (
        <>
          <section
            className="fr-mb-4w"
            aria-label="Sujets à aborder"
            style={{
              background: "var(--background-alt-blue-france)",
              padding: "1rem 1.25rem",
            }}
          >
            <div
              className="fr-mb-2w"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem 0.75rem",
                alignItems: "baseline",
              }}
            >
              <h2 className="fr-h5" style={{ margin: 0 }}>
                Sujets à aborder
              </h2>
              <span className="fr-hint-text" style={{ margin: 0 }}>
                {traiteCount}/{agendaSorted.length} traités
              </span>
            </div>

            {agendaSorted.length === 0 ? (
              <p className="fr-text--sm fr-mb-2w" style={{ color: "var(--text-mention-grey)" }}>
                Aucun sujet proposé pour l’instant.
              </p>
            ) : (
              <ul
                className="fr-raw-list fr-mb-2w"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  margin: 0,
                  padding: 0,
                }}
              >
                {agendaSorted.map((s) => {
                  const mid = extractGristReferenceId(s.Mission) ?? null;
                  return (
                    <li key={s.id}>
                      <AgendaSujetRow
                        sujet={s}
                        missionId={mid}
                        missionLabel={
                          mid != null ? missionTitleById.get(mid) : undefined
                        }
                        busy={agendaBusy || data.isReloading}
                        onToggle={(id, traite) => void onToggleTraite(id, traite)}
                        onView={(row) => openAgendaDialog(row, "view")}
                        onEdit={(row) => openAgendaDialog(row, "edit")}
                      />
                    </li>
                  );
                })}
              </ul>
            )}

            <form onSubmit={(e) => void onAddSujet(e)}>
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
                <div className="fr-col-12 fr-col-md-6">
                  <Input
                    label="Proposer un sujet"
                    nativeInputProps={{
                      value: newSujet,
                      onChange: (e) => setNewSujet(e.target.value),
                      disabled: agendaBusy,
                      "aria-required": true,
                      placeholder: "Proposer un sujet (Entrée)",
                    }}
                  />
                </div>
                <div className="fr-col-12 fr-col-md-4">
                  <Select
                    label="Mission liée"
                    nativeSelectProps={{
                      value: newMissionId,
                      onChange: (e) => setNewMissionId(e.target.value),
                      disabled: agendaBusy,
                    }}
                  >
                    <option value="">Sans mission liée</option>
                    {cards.map((c) => (
                      <option key={c.missionId} value={String(c.missionId)}>
                        {c.titre}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="fr-col-12 fr-col-md-2">
                  <Button
                    type="submit"
                    disabled={agendaBusy || data.isReloading}
                    iconId="fr-icon-add-line"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
              <Input
                className="fr-mt-2w"
                label="Votre prénom (auteur)"
                hintText="Signe le sujet. Prérempli avec votre prénom (fiche Équipe), sinon le début de votre e-mail de session."
                nativeInputProps={{
                  value: auteur,
                  onChange: (e) => setAuteur(e.target.value),
                  disabled: agendaBusy,
                  placeholder: defaultWeeklyAuteurPrenom(displayName, sessionEmail) || undefined,
                  autoComplete: "given-name",
                }}
              />
            </form>

            <AgendaSujetDialog
              sujet={dialogSujet}
              mode={dialogMode}
              missionLabel={
                dialogSujet != null
                  ? missionTitleById.get(
                      extractGristReferenceId(dialogSujet.Mission) ?? -1,
                    )
                  : undefined
              }
              busy={agendaBusy || data.isReloading}
              onClose={() => setDialogSujet(null)}
              onSave={onSaveAgendaTexte}
              onSwitchToEdit={() => setDialogMode("edit")}
            />
          </section>

          <section aria-label="Kanban des missions">
            <div
              className="fr-mb-2w"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem 0.75rem",
                alignItems: "baseline",
              }}
            >
              <h2 className="fr-h5" style={{ margin: 0 }}>
                Missions
              </h2>
              <span className="fr-hint-text" style={{ margin: 0 }}>
                {cards.length} mission{cards.length > 1 ? "s" : ""}.
              </span>
              <span className="fr-hint-text" style={{ margin: 0 }}>
                Déplacez une carte (glisser-déposer) ou changez la phase au clavier
                via le menu de chaque carte.
              </span>
              {data.isReloading ? (
                <span className="fr-text--xs" role="status">
                  Mise à jour…
                </span>
              ) : null}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(15.5rem, 1fr))",
                gap: "0.75rem",
                alignItems: "start",
              }}
            >
              {WEEKLY_PHASES.map((col) => (
                <div
                  key={col.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={onDropColumn(col.key)}
                  style={{
                    background: col.colBg,
                    padding: "0.75rem",
                    minHeight: "12rem",
                  }}
                >
                  <h3
                    className="fr-text--sm"
                    style={{
                      margin: "0 0 0.75rem",
                      fontWeight: 700,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.375rem",
                      alignItems: "center",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "0.5rem",
                        height: "0.5rem",
                        borderRadius: "50%",
                        background: col.dot,
                        flexShrink: 0,
                      }}
                    />
                    <span>{col.label}</span>
                    <span style={{ fontWeight: 400, color: "var(--text-mention-grey)" }}>
                      ({byPhase[col.key].length})
                    </span>
                  </h3>
                  {byPhase[col.key].map((card) => (
                    <WeeklyCardView
                      key={card.missionId}
                      card={card}
                      busy={busyMissionId === card.missionId || data.isReloading}
                      onPhaseChange={(id, phase) => void changePhase(id, phase)}
                      onDragStart={setDragMissionId}
                      onDragEnd={() => setDragMissionId(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
