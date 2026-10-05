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
import { EquipeAvatar } from "../components/equipe/EquipeAvatar";
import { MissionProse } from "../components/missions/MissionProse";
import { WeeklySuiviDrawer } from "../components/weekly/WeeklySuiviDrawer";
import { useAclProfil } from "../AclProfilContext";
import { useGristPa } from "../GristPaContext";
import { useWeeklyCoachData } from "../hooks/useWeeklyCoachData";
import { NothingHerePage } from "../security/NothingHerePage";
import { extractGristReferenceId } from "../utils/gristReferences";
import {
  defaultWeeklyAuteurPrenom,
  formatWeeklyAgendaCreatedAt,
  parseWeeklyAgendaCreatedAt,
  weeklyAgendaAuteurPrenom,
} from "../utils/weeklyAgenda";
import {
  createWeeklyAgendaRecord,
  updateWeeklyAgendaSujet,
  updateWeeklyAgendaTraite,
  upsertWeeklyPhase,
  upsertWeeklyPhaseSuivi,
} from "../utils/weeklyGristWrite";
import {
  WEEKLY_PHASES,
  buildWeeklyCards,
  groupCardsByPhase,
  phaseRowsToMap,
  weeklyMeteoIconClass,
  weeklyMeteoLabel,
  weeklyMeteoTone,
  type WeeklyCard,
  type WeeklyPhaseKey,
} from "../utils/weeklyPhases";
import { firstNameFromDisplayName } from "../utils/welcomeHomeByRole";
import type { WeeklyAgendaRow } from "../types";

type AgendaDialogMode = "view" | "edit" | "create";

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
  const titre = (sujet.Texte ?? "Sujet").trim();
  const auteur = weeklyAgendaAuteurPrenom(sujet.Auteur);
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
          {titre}
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
          <span>
            {auteur}
            {createdLabel && createdAt ? (
              <>
                {" "}
                <span aria-hidden="true">·</span>{" "}
                <time dateTime={createdAt.toISOString()}>{createdLabel}</time>
              </>
            ) : null}
          </span>
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
          title={`Voir le sujet : ${titre}`}
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
          title={`Modifier le sujet : ${titre}`}
        >
          Modifier
        </Button>
      </div>
    </article>
  );
}

function AgendaSujetDialog({
  open,
  sujet,
  mode,
  missionLabel,
  missionId,
  missionOptions,
  defaultAuteur,
  /** Préremplissage mission en mode create (ex. depuis drawer suivi). */
  defaultCreateMissionId = null,
  busy,
  onClose,
  onSave,
  onCreate,
  onSwitchToEdit,
}: {
  open: boolean;
  sujet: WeeklyAgendaRow | null;
  mode: AgendaDialogMode;
  missionLabel?: string;
  missionId: number | null;
  missionOptions: { id: number; label: string }[];
  defaultAuteur: string;
  defaultCreateMissionId?: number | null;
  busy: boolean;
  onClose: () => void;
  onSave: (input: {
    id: number;
    texte: string;
    detail: string;
    missionId: number | null;
  }) => Promise<void>;
  onCreate: (input: {
    texte: string;
    detail: string;
    missionId: number | null;
    auteur: string;
  }) => Promise<void>;
  onSwitchToEdit: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const titreFieldId = useId();
  const detailFieldId = useId();
  const missionFieldId = useId();
  const auteurFieldId = useId();
  const [draftTitre, setDraftTitre] = useState("");
  const [draftDetail, setDraftDetail] = useState("");
  const [draftMissionId, setDraftMissionId] = useState("");
  const [draftAuteur, setDraftAuteur] = useState("");
  /** Erreur de validation champ (titre vide). */
  const [localError, setLocalError] = useState<string | null>(null);
  /** Erreur d’écriture Grist — Alert dans le tiroir (pas derrière). */
  const [writeError, setWriteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      setDraftTitre("");
      setDraftDetail("");
      setDraftMissionId(
        defaultCreateMissionId != null && defaultCreateMissionId > 0
          ? String(defaultCreateMissionId)
          : "",
      );
      setDraftAuteur(defaultAuteur);
    } else {
      setDraftTitre((sujet?.Texte ?? "").trim());
      setDraftDetail((sujet?.Detail ?? "").trim());
      const mid = extractGristReferenceId(sujet?.Mission);
      setDraftMissionId(mid != null && mid > 0 ? String(mid) : "");
      setDraftAuteur("");
    }
    setLocalError(null);
    setWriteError(null);
  }, [
    open,
    mode,
    sujet?.id,
    sujet?.Texte,
    sujet?.Detail,
    sujet?.Mission,
    defaultAuteur,
    defaultCreateMissionId,
  ]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      if (mode === "create" || mode === "edit") {
        // Focus titre après ouverture (trap focus natif du dialog).
        requestAnimationFrame(() => {
          document.getElementById(titreFieldId)?.focus();
        });
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, mode, titreFieldId]);

  const createdAt = parseWeeklyAgendaCreatedAt(sujet?.Cree_le);
  const createdLabel = formatWeeklyAgendaCreatedAt(sujet?.Cree_le);
  const auteur = weeklyAgendaAuteurPrenom(sujet?.Auteur);
  const titre = (sujet?.Texte ?? "").trim();
  const detail = (sujet?.Detail ?? "").trim();

  const close = () => {
    dialogRef.current?.close();
  };

  const parsedMissionId = (): number | null => {
    const mid = draftMissionId ? Number(draftMissionId) : null;
    return mid != null && Number.isFinite(mid) && mid > 0 ? mid : null;
  };

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    const nextTitre = draftTitre.trim();
    if (!nextTitre) {
      setLocalError("Saisissez un titre.");
      setWriteError(null);
      document.getElementById(titreFieldId)?.focus();
      return;
    }
    setLocalError(null);
    setWriteError(null);
    try {
      if (mode === "create") {
        await onCreate({
          texte: nextTitre,
          detail: draftDetail,
          missionId: parsedMissionId(),
          auteur: draftAuteur.trim() || defaultAuteur || "Anonyme",
        });
        return;
      }
      if (sujet == null) return;
      await onSave({
        id: sujet.id,
        texte: nextTitre,
        detail: draftDetail,
        missionId: parsedMissionId(),
      });
    } catch (err) {
      setWriteError(
        err instanceof Error
          ? err.message
          : mode === "create"
            ? "Impossible d’ajouter le sujet."
            : "Impossible d’enregistrer le sujet.",
      );
    }
  };

  const dialogTitle =
    mode === "create"
      ? "Nouveau sujet"
      : mode === "edit"
        ? "Modifier le sujet"
        : "Sujet à aborder";

  // Drawer pilotage (pas fr-modal) : showModal() + classes DSFR sans JS disclose
  // laisse un scrim natif invisible / piégé.
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
                    {dialogTitle}
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
              {mode === "view" && sujet != null ? (
                <>
                  <h3 className="fr-h6 fr-mb-1w" style={{ marginTop: 0 }}>
                    {titre || "—"}
                  </h3>
                  {detail ? (
                    <div className="fr-mb-2w">
                      <MissionProse value={detail} onInternalLinkClick={close} />
                    </div>
                  ) : (
                    <p
                      className="fr-text--sm fr-mb-2w"
                      style={{ color: "var(--text-mention-grey)" }}
                    >
                      Aucun détail.
                    </p>
                  )}
                  <p className="fr-text--sm fr-mb-1w">
                    <span className="fr-hint-text" style={{ display: "block" }}>
                      Mission liée
                    </span>
                    {missionId != null && missionLabel ? (
                      <Link className="fr-link" to={`/missions/${missionId}`}>
                        {missionLabel}
                      </Link>
                    ) : (
                      <span style={{ color: "var(--text-mention-grey)" }}>
                        Sans mission liée
                      </span>
                    )}
                  </p>
                  <p className="fr-text--xs" style={{ color: "var(--text-mention-grey)" }}>
                    {auteur}
                    {createdLabel && createdAt ? (
                      <>
                        {" "}
                        <span aria-hidden="true">·</span>{" "}
                        <time dateTime={createdAt.toISOString()}>{createdLabel}</time>
                      </>
                    ) : null}
                  </p>
                </>
              ) : mode === "edit" || mode === "create" ? (
                <form ref={formRef} onSubmit={(e) => void submitForm(e)}>
                  <Input
                    label="Titre"
                    hintText="Affiché dans la liste compacte."
                    state={localError ? "error" : "default"}
                    stateRelatedMessage={localError ?? undefined}
                    nativeInputProps={{
                      id: titreFieldId,
                      value: draftTitre,
                      onChange: (e) => setDraftTitre(e.target.value),
                      disabled: busy,
                      "aria-required": true,
                    }}
                  />
                  <Input
                    className="fr-mt-2w"
                    label="Détail"
                    hintText="Optionnel — Markdown léger (titres, listes, liens http(s) ou page interne). Visible uniquement ici, pas dans la liste."
                    textArea
                    nativeTextAreaProps={{
                      id: detailFieldId,
                      value: draftDetail,
                      onChange: (e) => setDraftDetail(e.target.value),
                      disabled: busy,
                      rows: 5,
                    }}
                  />
                  <Select
                    className="fr-mt-2w"
                    label="Mission liée"
                    hint="Optionnel — rattache le sujet à une mission du kanban."
                    nativeSelectProps={{
                      id: missionFieldId,
                      value: draftMissionId,
                      onChange: (e) => setDraftMissionId(e.target.value),
                      disabled: busy,
                    }}
                  >
                    <option value="">Sans mission liée</option>
                    {missionOptions.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                  {mode === "create" ? (
                    <Input
                      className="fr-mt-2w"
                      label="Votre prénom (auteur)"
                      hintText="Signe le sujet. Prérempli avec votre prénom (fiche Équipe), sinon le début de votre e-mail de session."
                      nativeInputProps={{
                        id: auteurFieldId,
                        value: draftAuteur,
                        onChange: (e) => setDraftAuteur(e.target.value),
                        disabled: busy,
                        placeholder: defaultAuteur || undefined,
                        autoComplete: "given-name",
                      }}
                    />
                  ) : null}
                  {writeError ? (
                    <Alert
                      className="fr-mt-2w"
                      severity="error"
                      small
                      title="Enregistrement impossible"
                      description={writeError}
                    />
                  ) : null}
                </form>
              ) : null}

              <ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-mt-3w">
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
                        {mode === "create" ? "Ajouter" : "Enregistrer"}
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
    </dialog>
  );
}

function WeeklyCardView({
  card,
  busy,
  onOpenSuivi,
  onDragStart,
  onDragEnd,
}: {
  card: WeeklyCard;
  busy: boolean;
  onOpenSuivi: (missionId: number) => void;
  onDragStart: (missionId: number) => void;
  onDragEnd: () => void;
}) {
  const suppressClickRef = useRef(false);
  const meteoTone = card.meteo ? weeklyMeteoTone(card.meteo) : null;
  const meteoLabel = card.meteo ? weeklyMeteoLabel(card.meteo) : "";
  const hasNote = Boolean(card.noteOps.trim());
  const metaParts = [
    card.produitLabel,
    ...card.departements,
  ].filter(Boolean);
  const membreId =
    card.membreEquipeId != null && card.membreEquipeId > 0
      ? card.membreEquipeId
      : null;
  const membrePrenom =
    membreId != null
      ? firstNameFromDisplayName(card.membreEquipeLabel) ||
        card.membreEquipeLabel ||
        `Personne #${membreId}`
      : null;

  const openSuivi = () => {
    if (busy) return;
    onOpenSuivi(card.missionId);
  };

  const ariaLabel = [
    card.titre,
    hasNote ? "note de suivi" : null,
    "ouvrir le suivi",
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <article
      className={`weekly-card${busy ? "" : " weekly-card--interactive"}`}
      draggable={!busy}
      onDragStart={() => {
        suppressClickRef.current = true;
        onDragStart(card.missionId);
      }}
      onDragEnd={onDragEnd}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        openSuivi();
      }}
      onKeyDown={(e) => {
        if (busy) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openSuivi();
        }
      }}
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={busy || undefined}
    >
      {meteoTone ? (
        <span
          className={`weekly-card__meteo-badge weekly-card__meteo-badge--${meteoTone}`}
          title={`Météo : ${meteoLabel}`}
          aria-hidden="true"
        >
          <span
            className={`${weeklyMeteoIconClass(card.meteo)} fr-icon--sm`}
            aria-hidden="true"
          />
        </span>
      ) : null}

      <h3 className="weekly-card__title">{card.titre}</h3>

      {metaParts.length > 0 ? (
        <p className="weekly-card__meta">
          {metaParts.map((part, i) => (
            <span key={`${part}-${i}`}>
              {i > 0 ? (
                <span aria-hidden="true" className="weekly-card__meta-sep">
                  ·
                </span>
              ) : null}
              {part}
            </span>
          ))}
        </p>
      ) : null}

      {membreId != null && membrePrenom != null ? (
        <p className="weekly-card__member">
          <EquipeAvatar
            avatar={card.membreEquipeAvatar}
            memberId={membreId}
            size="sm"
          />
          <span>{membrePrenom}</span>
        </p>
      ) : null}

      {hasNote ? (
        <p className="weekly-card__badges" aria-hidden="true">
          <span
            className="fr-icon-align-left fr-icon--sm weekly-card__note-icon"
            title="Note de suivi"
          />
        </p>
      ) : null}
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSujet, setDialogSujet] = useState<WeeklyAgendaRow | null>(null);
  const [dialogMode, setDialogMode] = useState<AgendaDialogMode>("view");
  const [suiviOpen, setSuiviOpen] = useState(false);
  const [suiviMissionId, setSuiviMissionId] = useState<number | null>(null);
  const [suiviBusy, setSuiviBusy] = useState(false);
  /** Mission préremplie pour create agenda (depuis drawer suivi). */
  const [createAgendaMissionId, setCreateAgendaMissionId] = useState<
    number | null
  >(null);
  const nouveauSujetCtaId = "weekly-nouveau-sujet-cta";

  const defaultAuteur = defaultWeeklyAuteurPrenom(displayName, sessionEmail);

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

  const missionOptions = useMemo(
    () => cards.map((c) => ({ id: c.missionId, label: c.titre })),
    [cards],
  );

  const equipeOptions = useMemo(
    () =>
      data.intervenants
        .map((p) => ({
          id: p.id,
          label: (p.Prenom_Nom ?? "").trim() || `Personne #${p.id}`,
        }))
        .filter((p) => p.label.length > 0)
        .sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [data.intervenants],
  );

  const suiviCard = useMemo(
    () =>
      suiviMissionId != null
        ? (cards.find((c) => c.missionId === suiviMissionId) ?? null)
        : null,
    [cards, suiviMissionId],
  );

  const agendaLiesSuivi = useMemo(() => {
    if (suiviMissionId == null) return [];
    return agendaSorted.filter(
      (s) => extractGristReferenceId(s.Mission) === suiviMissionId,
    );
  }, [agendaSorted, suiviMissionId]);

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  const openSuivi = (missionId: number) => {
    setSuiviMissionId(missionId);
    setSuiviOpen(true);
  };

  const closeSuivi = () => {
    setSuiviOpen(false);
    setSuiviMissionId(null);
  };

  const onSaveSuivi = async (input: {
    missionId: number;
    phaseRowId: number | null;
    phase: WeeklyPhaseKey;
    meteo: string;
    noteOps: string;
    membreEquipeId: number | null;
  }) => {
    const existingPhaseId =
      input.phaseRowId ??
      phaseRowsToMap(data.phases).get(input.missionId)?.phaseId ??
      null;
    setPhaseError(null);
    setSuiviBusy(true);
    try {
      await upsertWeeklyPhaseSuivi({
        phaseRowId: existingPhaseId,
        missionId: input.missionId,
        phase: input.phase,
        meteo: input.meteo,
        noteOps: input.noteOps,
        membreEquipeId: input.membreEquipeId,
      });
      await data.reload();
      closeSuivi();
    } catch (e) {
      throw e instanceof Error
        ? e
        : new Error("Impossible d’enregistrer le suivi.");
    } finally {
      setSuiviBusy(false);
    }
  };

  const openCreateAgendaForMission = (missionId: number) => {
    closeSuivi();
    setCreateAgendaMissionId(missionId);
    setDialogMode("create");
    setDialogSujet(null);
    setDialogOpen(true);
  };

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

  const closeAgendaDialog = () => {
    const restoreCta = dialogMode === "create";
    setDialogOpen(false);
    setDialogSujet(null);
    setCreateAgendaMissionId(null);
    if (restoreCta) {
      // Focus retour au CTA après create (succès / Annuler / Échap / scrim).
      requestAnimationFrame(() => {
        document.getElementById(nouveauSujetCtaId)?.focus();
      });
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
    setDialogOpen(true);
  };

  const openCreateAgendaDialog = (missionId: number | null = null) => {
    setCreateAgendaMissionId(missionId);
    setDialogMode("create");
    setDialogSujet(null);
    setDialogOpen(true);
  };

  const onSaveAgendaSujet = async (input: {
    id: number;
    texte: string;
    detail: string;
    missionId: number | null;
  }) => {
    setAgendaError(null);
    setAgendaBusy(true);
    try {
      await updateWeeklyAgendaSujet(input.id, {
        texte: input.texte,
        detail: input.detail,
        missionId: input.missionId,
      });
      closeAgendaDialog();
      await data.reload();
    } catch (err) {
      // Remonter au drawer (Alert visible) — pas d’Alert page derrière le tiroir.
      throw err instanceof Error
        ? err
        : new Error("Impossible d’enregistrer le sujet.");
    } finally {
      setAgendaBusy(false);
    }
  };

  const onCreateAgendaSujet = async (input: {
    texte: string;
    detail: string;
    missionId: number | null;
    auteur: string;
  }) => {
    setAgendaError(null);
    setAgendaBusy(true);
    try {
      await createWeeklyAgendaRecord({
        texte: input.texte,
        detail: input.detail,
        auteur: input.auteur,
        email: sessionEmail ?? "",
        missionId: input.missionId,
      });
      closeAgendaDialog();
      await data.reload();
    } catch (err) {
      // Remonter au drawer (Alert visible) — pas d’Alert page derrière le tiroir.
      throw err instanceof Error
        ? err
        : new Error("Impossible d’ajouter le sujet.");
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
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
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
              <Button
                type="button"
                priority="secondary"
                size="small"
                iconId="fr-icon-add-line"
                disabled={agendaBusy || data.isReloading}
                onClick={() => openCreateAgendaDialog()}
                nativeButtonProps={{ id: nouveauSujetCtaId }}
              >
                Nouveau sujet
              </Button>
            </div>

            {agendaSorted.length === 0 ? (
              <p className="fr-text--sm fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
                Aucun sujet proposé pour l’instant.
              </p>
            ) : (
              <ul
                className="fr-raw-list fr-mb-0"
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

            <AgendaSujetDialog
              open={dialogOpen}
              sujet={dialogSujet}
              mode={dialogMode}
              missionId={
                dialogSujet != null
                  ? extractGristReferenceId(dialogSujet.Mission) ?? null
                  : null
              }
              missionLabel={
                dialogSujet != null
                  ? missionTitleById.get(
                      extractGristReferenceId(dialogSujet.Mission) ?? -1,
                    )
                  : undefined
              }
              missionOptions={missionOptions}
              defaultAuteur={defaultAuteur}
              defaultCreateMissionId={createAgendaMissionId}
              busy={agendaBusy || data.isReloading}
              onClose={closeAgendaDialog}
              onSave={onSaveAgendaSujet}
              onCreate={onCreateAgendaSujet}
              onSwitchToEdit={() => setDialogMode("edit")}
            />
          </section>

          <WeeklySuiviDrawer
            open={suiviOpen}
            card={suiviCard}
            agendaLies={agendaLiesSuivi}
            equipeOptions={equipeOptions}
            busy={suiviBusy || data.isReloading}
            onClose={closeSuivi}
            onSaveSuivi={onSaveSuivi}
            onViewSujet={(sujet) => {
              closeSuivi();
              openAgendaDialog(sujet, "view");
            }}
            onNouveauSujet={openCreateAgendaForMission}
          />

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
                      onOpenSuivi={openSuivi}
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
