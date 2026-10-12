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
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { Link } from "react-router-dom";
import { EquipeAvatar } from "../components/equipe/EquipeAvatar";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { KanbanCardShell } from "../components/kanban/KanbanCardShell";
import { MissionProse } from "../components/missions/MissionProse";
import { WeeklyActionFormDrawer } from "../components/weekly/WeeklyActionFormDrawer";
import { WeeklyActionsPanel } from "../components/weekly/WeeklyActionsPanel";
import {
  WeeklyLinkActionDialog,
  type WeeklyLinkActionContext,
} from "../components/weekly/WeeklyLinkActionDialog";
import { WeeklyLinkedActionsSection } from "../components/weekly/WeeklyLinkedActionsSection";
import { WeeklySuiviDrawer } from "../components/weekly/WeeklySuiviDrawer";
import { useAclProfil } from "../AclProfilContext";
import { useGristPa } from "../GristPaContext";
import { useWeeklyCoachAllowlist } from "../hooks/useWeeklyCoachAllowlist";
import { useWeeklyCoachData } from "../hooks/useWeeklyCoachData";
import { NothingHerePage } from "../security/NothingHerePage";
import { extractGristReferenceId } from "../utils/gristReferences";
import {
  filterWeeklyActionsByMission,
  filterWeeklyActionsBySujet,
  filterWeeklyActionsEnCours,
} from "../utils/weeklyAction";
import {
  defaultWeeklyAuteurPrenom,
  formatWeeklyAgendaCreatedAt,
  groupWeeklyAgendaHistory,
  parseWeeklyAgendaCreatedAt,
  weeklyAgendaAuteurPrenom,
} from "../utils/weeklyAgenda";
import { weeklyOpsMembreOptions } from "../utils/weeklyCoachAccess";
import {
  WEEKLY_ACTION_SUJET_COLUMN_READY,
  createWeeklyAgendaRecord,
  updateWeeklyAgendaSujet,
  updateWeeklyAgendaTraite,
  upsertWeeklyPhase,
  upsertWeeklyPhaseSuivi,
} from "../utils/weeklyGristWrite";
import type { WeeklyActionRow, WeeklyAgendaRow } from "../types";
import {
  WEEKLY_CARD_MEMBRE_AVATARS_VISIBLE,
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

type AgendaDialogMode = "view" | "edit" | "create";
/** Sous-nav sous l’onglet Sujets (V1) — historique sujets local, pas l’onglet global. */
type AgendaTab = "a-faire" | "historique";
/**
 * Onglets principaux Weekly Ops (V1).
 * TODO V1.1+ : 4ᵉ onglet « Historique » global (sujets traités + actions créées) —
 * ne pas l’afficher tant que la PR Historique n’est pas ouverte ; garder
 * À faire | Historique *sous* Sujets d’ici là.
 */
type WeeklyMainTab = "sujets" | "actions" | "kanban";
// Prêt pour la future PR : "sujets" | "actions" | "kanban" | "historique"

function AgendaSujetRow({
  sujet,
  missionLabel,
  missionId,
  busy,
  linkedActionsCount = 0,
  onToggle,
  onView,
  onEdit,
  onLierAction,
}: {
  sujet: WeeklyAgendaRow;
  missionLabel?: string;
  missionId: number | null;
  busy: boolean;
  /** Nombre d’actions liées via `Weekly_action.Sujet`. */
  linkedActionsCount?: number;
  onToggle: (id: number, traite: boolean) => void;
  onView: (sujet: WeeklyAgendaRow) => void;
  onEdit: (sujet: WeeklyAgendaRow) => void;
  onLierAction?: (sujet: WeeklyAgendaRow) => void;
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
          {linkedActionsCount > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {linkedActionsCount === 1
                  ? "1 action liée"
                  : `${linkedActionsCount} actions liées`}
              </span>
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
        {onLierAction ? (
          <Button
            type="button"
            priority="tertiary no outline"
            size="small"
            iconId="fr-icon-links-line"
            disabled={busy}
            onClick={() => onLierAction(sujet)}
            title={`Lier une action : ${titre}`}
          >
            Action
          </Button>
        ) : null}
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
  /** Actions déjà liées à ce sujet (`Weekly_action.Sujet`). */
  actionsLies = [],
  busy,
  onClose,
  onSave,
  onCreate,
  onSwitchToEdit,
  onLierAction,
  onViewAction,
}: {
  open: boolean;
  sujet: WeeklyAgendaRow | null;
  mode: AgendaDialogMode;
  missionLabel?: string;
  missionId: number | null;
  missionOptions: { id: number; label: string }[];
  defaultAuteur: string;
  defaultCreateMissionId?: number | null;
  actionsLies?: readonly WeeklyActionRow[];
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
  onLierAction?: (sujet: WeeklyAgendaRow) => void;
  onViewAction?: (action: WeeklyActionRow) => void;
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
                  <WeeklyLinkedActionsSection
                    titleId={titleId}
                    actions={actionsLies}
                    hint="Actions Ops rattachées à ce sujet."
                    locked={busy}
                    onLier={
                      onLierAction && sujet != null
                        ? () => onLierAction(sujet)
                        : undefined
                    }
                    onViewAction={onViewAction}
                  />
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
  linkedActionsCount = 0,
  onOpenSuivi,
  onLierAction,
  onDragStart,
  onDragEnd,
  onMovePhase,
}: {
  card: WeeklyCard;
  busy: boolean;
  /** Nombre d’actions liées via `Weekly_action.Mission`. */
  linkedActionsCount?: number;
  onOpenSuivi: (missionId: number) => void;
  onLierAction: (missionId: number, missionLabel: string) => void;
  onDragStart: (missionId: number) => void;
  onDragEnd: () => void;
  onMovePhase: (missionId: number, phase: WeeklyPhaseKey) => void;
}) {
  const meteoTone = card.meteo ? weeklyMeteoTone(card.meteo) : null;
  const meteoLabel = card.meteo ? weeklyMeteoLabel(card.meteo) : "";
  const hasNote = Boolean(card.noteOps.trim());
  const metaParts = [
    card.produitLabel,
    ...card.departements,
  ].filter(Boolean);
  const membres = card.membresEquipe;
  const membrePrenoms = membres.map(
    (m) =>
      firstNameFromDisplayName(m.label) || m.label || `Personne #${m.id}`,
  );
  const membresAria =
    membrePrenoms.length > 0
      ? `Membres : ${membrePrenoms.join(", ")}`
      : null;
  const visibleMembres = membres.slice(0, WEEKLY_CARD_MEMBRE_AVATARS_VISIBLE);
  const overflowCount = Math.max(
    0,
    membres.length - WEEKLY_CARD_MEMBRE_AVATARS_VISIBLE,
  );
  const actionsLabel =
    linkedActionsCount > 0
      ? linkedActionsCount === 1
        ? "1 action liée"
        : `${linkedActionsCount} actions liées`
      : null;

  // aria-label remplace le contenu pour le nom accessible : y inclure
  // météo / membres / meta visibles (sinon masqués aux lecteurs d’écran).
  const ariaLabel = [
    card.titre,
    meteoLabel ? `Météo : ${meteoLabel}` : null,
    membresAria,
    metaParts.length > 0 ? metaParts.join(", ") : null,
    hasNote ? "note de suivi" : null,
    actionsLabel,
    "ouvrir le suivi",
  ]
    .filter(Boolean)
    .join(" — ");

  const moveTargets = WEEKLY_PHASES.filter((p) => p.key !== card.phase).map(
    (p) => ({ key: p.key, label: p.label }),
  );

  return (
    <KanbanCardShell
      cardId={card.missionId}
      busy={busy}
      ariaLabel={ariaLabel}
      className="weekly-card"
      onActivate={() => onOpenSuivi(card.missionId)}
      onDragStart={(id) => onDragStart(Number(id))}
      onDragEnd={onDragEnd}
      moveTargets={moveTargets}
      onMove={(key) => onMovePhase(card.missionId, key as WeeklyPhaseKey)}
      menuTitle={`Actions Weekly — ${card.titre}`}
      menuItems={[
        {
          id: "suivi",
          label: "Ouvrir le suivi",
          iconClassName: "fr-icon-eye-line",
          onClick: () => onOpenSuivi(card.missionId),
        },
        {
          id: "lier-action",
          label: "Lier une action",
          iconClassName: "fr-icon-links-line",
          onClick: () => onLierAction(card.missionId, card.titre),
        },
      ]}
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

      <h3 className="weekly-card__title pilotage-kanban-card__title">{card.titre}</h3>

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

      {membres.length > 0 ? (
        <p className="weekly-card__member" aria-hidden="true">
          <span className="weekly-card__avatars">
            {visibleMembres.map((m) => (
              <EquipeAvatar
                key={m.id}
                avatar={m.avatar}
                memberId={m.id}
                size="sm"
              />
            ))}
            {overflowCount > 0 ? (
              <span className="weekly-card__avatar-overflow">
                +{overflowCount}
              </span>
            ) : null}
          </span>
        </p>
      ) : null}

      {hasNote || linkedActionsCount > 0 ? (
        <p className="weekly-card__badges" aria-hidden="true">
          {hasNote ? (
            <span
              className="fr-icon-align-left fr-icon--sm weekly-card__note-icon"
              title="Note de suivi"
            />
          ) : null}
          {linkedActionsCount > 0 ? (
            <span
              className="fr-badge fr-badge--sm fr-badge--blue-cumulus fr-badge--no-icon"
              title={actionsLabel ?? undefined}
            >
              {linkedActionsCount}
              {linkedActionsCount === 1 ? " action" : " actions"}
            </span>
          ) : null}
        </p>
      ) : null}
    </KanbanCardShell>
  );
}

export function WeeklyCoachPage() {
  const pa = useGristPa();
  const { email: sessionEmail, displayName } = useAclProfil();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useWeeklyCoachData(enabled);
  const coachAllowlist = useWeeklyCoachAllowlist(enabled);

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
  const [mainTab, setMainTab] = useState<WeeklyMainTab>("sujets");
  const [agendaTab, setAgendaTab] = useState<AgendaTab>("a-faire");
  const nouveauSujetCtaId = "weekly-nouveau-sujet-cta";
  const agendaTabsName = useId();
  const agendaPanelId = useId();
  const [actionError, setActionError] = useState<string | null>(null);
  /** Dialogue Créer | Rattacher (carte mission ou sujet). */
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkContext, setLinkContext] = useState<WeeklyLinkActionContext | null>(
    null,
  );
  /** Drawer create / édition action hors onglet Actions (lien depuis carte / sujet). */
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [linkFormMode, setLinkFormMode] = useState<
    "create" | "edit" | "view"
  >("create");
  const [linkFormAction, setLinkFormAction] = useState<WeeklyActionRow | null>(
    null,
  );
  const [linkFormDefaults, setLinkFormDefaults] = useState<{
    missionId: number | null;
    sujetId: number | null;
    lockMission: boolean;
  }>({ missionId: null, sujetId: null, lockMission: false });

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
    return [...data.agenda].sort((a, b) => a.id - b.id);
  }, [data.agenda]);

  /** Liste active : sujets non traités uniquement (HITL — traité disparaît). */
  const agendaAFaire = useMemo(
    () => agendaSorted.filter((s) => !s.Traite),
    [agendaSorted],
  );

  const agendaHistoriqueMonths = useMemo(
    () => groupWeeklyAgendaHistory(data.agenda),
    [data.agenda],
  );

  const historiqueSujetCount = useMemo(
    () => agendaHistoriqueMonths.reduce((n, m) => n + m.sujetCount, 0),
    [agendaHistoriqueMonths],
  );

  const actionsEnCoursCount = useMemo(
    () => filterWeeklyActionsEnCours(data.actions).length,
    [data.actions],
  );

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

  /** Options drawer action — sujets agenda (à faire + historique). */
  const sujetOptions = useMemo(
    () =>
      [...data.agenda]
        .map((s) => ({
          id: s.id,
          label: (s.Texte ?? "").trim() || `Sujet #${s.id}`,
        }))
        .sort((a, b) =>
          a.label.localeCompare(b.label, "fr", { sensitivity: "base" }),
        ),
    [data.agenda],
  );

  const equipeOptions = useMemo(
    () => weeklyOpsMembreOptions(data.intervenants, coachAllowlist.emails),
    [data.intervenants, coachAllowlist.emails],
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

  const actionsLiesSuivi = useMemo(() => {
    if (suiviMissionId == null) return [];
    return filterWeeklyActionsByMission(data.actions, suiviMissionId);
  }, [data.actions, suiviMissionId]);

  /** Compteurs actions liées par mission (badge carte kanban). */
  const linkedActionsCountByMission = useMemo(() => {
    const map = new Map<number, number>();
    for (const action of data.actions) {
      const mid = extractGristReferenceId(action.Mission);
      if (mid == null || mid <= 0) continue;
      map.set(mid, (map.get(mid) ?? 0) + 1);
    }
    return map;
  }, [data.actions]);

  /** Compteurs actions liées par sujet (méta ligne agenda). */
  const linkedActionsCountBySujet = useMemo(() => {
    const map = new Map<number, number>();
    for (const action of data.actions) {
      const sid = extractGristReferenceId(action.Sujet);
      if (sid == null || sid <= 0) continue;
      map.set(sid, (map.get(sid) ?? 0) + 1);
    }
    return map;
  }, [data.actions]);

  const actionsLiesSujetDialog = useMemo(() => {
    if (dialogSujet == null) return [];
    return filterWeeklyActionsBySujet(data.actions, dialogSujet.id);
  }, [data.actions, dialogSujet]);

  const porteurLabelById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of data.intervenants) {
      const label =
        firstNameFromDisplayName(p.Prenom_Nom ?? "") ||
        (p.Prenom_Nom ?? "").trim() ||
        `Personne #${p.id}`;
      m.set(p.id, label);
    }
    return m;
  }, [data.intervenants]);

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  const openSuivi = (missionId: number) => {
    setSuiviMissionId(missionId);
    setSuiviOpen(true);
  };

  const openLinkActionForMission = (
    missionId: number,
    missionLabel: string,
  ) => {
    setLinkContext({
      missionId,
      sujetId: null,
      contextLabel: missionLabel,
    });
    setLinkDialogOpen(true);
  };

  const openLinkActionForSujet = (sujet: WeeklyAgendaRow) => {
    const titre = (sujet.Texte ?? "Sujet").trim() || "Sujet";
    const mid = extractGristReferenceId(sujet.Mission);
    setLinkContext({
      missionId: mid != null && mid > 0 ? mid : null,
      sujetId: sujet.id,
      contextLabel: titre,
    });
    setLinkDialogOpen(true);
  };

  const closeLinkDialog = () => {
    setLinkDialogOpen(false);
    setLinkContext(null);
  };

  const openLinkCreateForm = (ctx: WeeklyLinkActionContext) => {
    setLinkFormMode("create");
    setLinkFormAction(null);
    setLinkFormDefaults({
      missionId:
        ctx.missionId != null && ctx.missionId > 0 ? ctx.missionId : null,
      sujetId: ctx.sujetId != null && ctx.sujetId > 0 ? ctx.sujetId : null,
      lockMission: ctx.missionId != null && ctx.missionId > 0,
    });
    setLinkFormOpen(true);
  };

  /** Clic action liée → fiche lecture (pas le formulaire). */
  const openLinkViewForm = (action: WeeklyActionRow) => {
    setLinkFormMode("view");
    setLinkFormAction(action);
    setLinkFormDefaults({
      missionId: null,
      sujetId: null,
      lockMission: false,
    });
    setLinkFormOpen(true);
  };

  const closeLinkForm = () => {
    setLinkFormOpen(false);
    setLinkFormAction(null);
  };

  const reloadActions = async () => {
    setActionError(null);
    try {
      await data.reload();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Impossible de recharger les actions.",
      );
    }
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
    membreEquipeIds: number[];
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
        membreEquipeIds: input.membreEquipeIds,
      });
      // Rester dans le drawer (lecture) — comme le contexte mission.
      await data.reload();
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
    setMainTab("sujets");
    setAgendaTab("a-faire");
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
      {actionError ? (
        <Alert
          className="fr-mb-2w"
          severity="error"
          small
          title="Actions"
          description={actionError}
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
          <Tabs
            label="Sections Weekly Ops"
            className="fr-mb-2w"
            selectedTabId={mainTab}
            onTabChange={(tabId) => {
              // Pas d’onglet « historique » en V1 (préparé en type / TODO ci-dessus).
              if (tabId === "actions" || tabId === "kanban" || tabId === "sujets") {
                setMainTab(tabId);
              }
            }}
            tabs={[
              {
                tabId: "sujets",
                label: "Sujets",
                iconId: "fr-icon-chat-3-line",
              },
              {
                tabId: "actions",
                label:
                  actionsEnCoursCount > 0
                    ? `Actions (${actionsEnCoursCount})`
                    : "Actions",
                iconId: "fr-icon-checkbox-circle-line",
              },
              {
                tabId: "kanban",
                label: "Kanban",
                iconId: "fr-icon-layout-grid-line",
              },
              // TODO V1.1+ : { tabId: "historique", label: "Historique", iconId: "fr-icon-time-line" },
            ]}
          >
            {mainTab === "sujets" ? (
              <section
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
                  <h2 className="fr-h5" style={{ margin: 0 }}>
                    Sujets à aborder
                  </h2>
                  {agendaTab === "a-faire" ? (
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
                  ) : null}
                </div>

                <div className="fr-mb-2w">
                  <SegmentedControl
                    legend="À faire ou Historique des sujets"
                    hideLegend
                    name={agendaTabsName}
                    small
                    segments={[
                      {
                        label: `À faire (${agendaAFaire.length})`,
                        nativeInputProps: {
                          value: "a-faire",
                          checked: agendaTab === "a-faire",
                          onChange: () => setAgendaTab("a-faire"),
                          "aria-controls": agendaPanelId,
                        },
                      },
                      {
                        label: `Historique (${historiqueSujetCount})`,
                        nativeInputProps: {
                          value: "historique",
                          checked: agendaTab === "historique",
                          onChange: () => setAgendaTab("historique"),
                          "aria-controls": agendaPanelId,
                        },
                      },
                    ]}
                  />
                </div>

                <div id={agendaPanelId} role="tabpanel">
                  {agendaTab === "a-faire" ? (
                    agendaAFaire.length === 0 ? (
                      <p
                        className="fr-text--sm fr-mb-0"
                        style={{ color: "var(--text-mention-grey)" }}
                      >
                        Aucun sujet à aborder pour l’instant.
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
                        {agendaAFaire.map((s) => {
                          const mid = extractGristReferenceId(s.Mission) ?? null;
                          return (
                            <li key={s.id}>
                              <AgendaSujetRow
                                sujet={s}
                                missionId={mid}
                                missionLabel={
                                  mid != null
                                    ? missionTitleById.get(mid)
                                    : undefined
                                }
                                linkedActionsCount={
                                  linkedActionsCountBySujet.get(s.id) ?? 0
                                }
                                busy={agendaBusy || data.isReloading}
                                onToggle={(id, traite) =>
                                  void onToggleTraite(id, traite)
                                }
                                onView={(row) => openAgendaDialog(row, "view")}
                                onEdit={(row) => openAgendaDialog(row, "edit")}
                                onLierAction={openLinkActionForSujet}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    )
                  ) : historiqueSujetCount === 0 ? (
                    <p
                      className="fr-text--sm fr-mb-0"
                      style={{ color: "var(--text-mention-grey)" }}
                    >
                      Aucun sujet traité pour l’instant. Cochez un sujet dans « À
                      faire » pour le ranger ici par date.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.25rem",
                      }}
                    >
                      {agendaHistoriqueMonths.map((month) => (
                        <section
                          key={month.monthKey}
                          aria-label={`${month.label} — ${month.sujetCount} sujet${month.sujetCount > 1 ? "s" : ""} abordé${month.sujetCount > 1 ? "s" : ""}`}
                        >
                          <h3
                            className="fr-text--sm fr-mb-2w"
                            style={{
                              margin: 0,
                              fontWeight: 700,
                              color: "var(--text-title-grey)",
                            }}
                          >
                            {month.label}
                            <span
                              className="fr-hint-text"
                              style={{ marginLeft: "0.5rem", fontWeight: 400 }}
                            >
                              {month.sujetCount} sujet
                              {month.sujetCount > 1 ? "s" : ""} abordé
                              {month.sujetCount > 1 ? "s" : ""}
                            </span>
                          </h3>
                          <ol
                            className="fr-raw-list"
                            style={{
                              margin: 0,
                              padding: 0,
                              listStyle: "none",
                              display: "flex",
                              flexDirection: "column",
                              gap: "1rem",
                              borderLeft:
                                "2px solid var(--border-default-blue-france)",
                              paddingLeft: "1rem",
                            }}
                          >
                            {month.days.map((day) => (
                              <li key={day.dayKey}>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.5rem 0.75rem",
                                    alignItems: "baseline",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  <span
                                    className="fr-badge fr-badge--blue-france fr-badge--sm"
                                    title={day.labelLong}
                                  >
                                    {day.labelShort}
                                  </span>
                                  <h4
                                    className="fr-sr-only"
                                    id={`weekly-hist-day-${day.dayKey}`}
                                  >
                                    {day.labelLong}
                                  </h4>
                                  <span
                                    className="fr-hint-text"
                                    style={{ margin: 0 }}
                                  >
                                    {day.sujets.length} sujet
                                    {day.sujets.length > 1 ? "s" : ""}
                                  </span>
                                </div>
                                <ul
                                  className="fr-raw-list"
                                  aria-labelledby={`weekly-hist-day-${day.dayKey}`}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                    margin: 0,
                                    padding: 0,
                                  }}
                                >
                                  {day.sujets.map((s) => {
                                    const mid =
                                      extractGristReferenceId(s.Mission) ?? null;
                                    return (
                                      <li key={s.id}>
                                        <AgendaSujetRow
                                          sujet={s}
                                          missionId={mid}
                                          missionLabel={
                                            mid != null
                                              ? missionTitleById.get(mid)
                                              : undefined
                                          }
                                          linkedActionsCount={
                                            linkedActionsCountBySujet.get(s.id) ??
                                            0
                                          }
                                          busy={agendaBusy || data.isReloading}
                                          onToggle={(id, traite) =>
                                            void onToggleTraite(id, traite)
                                          }
                                          onView={(row) =>
                                            openAgendaDialog(row, "view")
                                          }
                                          onEdit={(row) =>
                                            openAgendaDialog(row, "edit")
                                          }
                                          onLierAction={openLinkActionForSujet}
                                        />
                                      </li>
                                    );
                                  })}
                                </ul>
                              </li>
                            ))}
                          </ol>
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {mainTab === "actions" ? (
              <section
                aria-label="Actions Weekly"
                style={{
                  background: "var(--background-alt-blue-france)",
                  padding: "1rem 1.25rem",
                }}
              >
                <WeeklyActionsPanel
                  actions={data.actions}
                  intervenants={data.intervenants}
                  missionTitleById={missionTitleById}
                  missionOptions={missionOptions}
                  sujetOptions={sujetOptions}
                  equipeOptions={equipeOptions}
                  sessionEmail={sessionEmail}
                  busy={data.isReloading}
                  onCreated={async () => {
                    setActionError(null);
                    try {
                      await data.reload();
                    } catch (err) {
                      setActionError(
                        err instanceof Error
                          ? err.message
                          : "Impossible de recharger les actions.",
                      );
                    }
                  }}
                />
              </section>
            ) : null}

            {mainTab === "kanban" ? (
              <section aria-label="Kanban des missions">
                <div className="fr-mb-2w">
                  <h2 className="fr-h5" style={{ margin: 0 }}>
                    Missions
                  </h2>
                </div>
                <KanbanBoard
                  ariaLabel="Kanban des missions"
                  columns={WEEKLY_PHASES.map((col) => ({
                    key: col.key,
                    label: col.label,
                    count: byPhase[col.key].length,
                    dot: col.dot,
                    colBg: col.colBg,
                  }))}
                  onDropColumn={(key, e) =>
                    onDropColumn(key as WeeklyPhaseKey)(e)
                  }
                  hint={
                    <>
                      <span className="fr-hint-text" style={{ margin: 0 }}>
                        {cards.length} mission{cards.length > 1 ? "s" : ""}.
                      </span>
                      <span className="fr-hint-text" style={{ margin: 0 }}>
                        Déplacez une carte (glisser-déposer) ou changez la phase
                        au clavier via le menu de chaque carte.
                      </span>
                      {data.isReloading ? (
                        <span className="fr-text--xs" role="status">
                          Mise à jour…
                        </span>
                      ) : null}
                    </>
                  }
                  renderCards={(columnKey) =>
                    byPhase[columnKey as WeeklyPhaseKey].map((card) => (
                      <WeeklyCardView
                        key={card.missionId}
                        card={card}
                        busy={
                          busyMissionId === card.missionId || data.isReloading
                        }
                        linkedActionsCount={
                          linkedActionsCountByMission.get(card.missionId) ?? 0
                        }
                        onOpenSuivi={openSuivi}
                        onLierAction={openLinkActionForMission}
                        onDragStart={setDragMissionId}
                        onDragEnd={() => setDragMissionId(null)}
                        onMovePhase={(id, phase) => void changePhase(id, phase)}
                      />
                    ))
                  }
                />
              </section>
            ) : null}
          </Tabs>

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
            actionsLies={actionsLiesSujetDialog}
            busy={agendaBusy || data.isReloading}
            onClose={closeAgendaDialog}
            onSave={onSaveAgendaSujet}
            onCreate={onCreateAgendaSujet}
            onSwitchToEdit={() => setDialogMode("edit")}
            onLierAction={openLinkActionForSujet}
            onViewAction={(action) => {
              closeAgendaDialog();
              openLinkViewForm(action);
            }}
          />

          <WeeklySuiviDrawer
            open={suiviOpen}
            card={suiviCard}
            agendaLies={agendaLiesSuivi}
            actionsLies={actionsLiesSuivi}
            equipeOptions={equipeOptions}
            busy={suiviBusy || data.isReloading}
            onClose={closeSuivi}
            onSaveSuivi={onSaveSuivi}
            onViewSujet={(sujet) => {
              closeSuivi();
              setMainTab("sujets");
              openAgendaDialog(sujet, "view");
            }}
            onNouveauSujet={openCreateAgendaForMission}
            onLierAction={openLinkActionForMission}
            onViewAction={(action) => {
              closeSuivi();
              openLinkViewForm(action);
            }}
          />

          <WeeklyLinkActionDialog
            open={linkDialogOpen}
            context={linkContext}
            actions={data.actions}
            porteurLabelById={porteurLabelById}
            sujetColumnReady={WEEKLY_ACTION_SUJET_COLUMN_READY}
            busy={data.isReloading}
            onClose={closeLinkDialog}
            onCreate={openLinkCreateForm}
            onAttached={reloadActions}
          />

          <WeeklyActionFormDrawer
            open={linkFormOpen}
            mode={linkFormMode}
            action={linkFormAction}
            missionOptions={missionOptions}
            sujetOptions={sujetOptions}
            equipeOptions={equipeOptions}
            intervenants={data.intervenants}
            sessionEmail={sessionEmail}
            busy={data.isReloading}
            defaultMissionId={linkFormDefaults.missionId}
            defaultSujetId={linkFormDefaults.sujetId}
            lockMission={linkFormDefaults.lockMission}
            onClose={closeLinkForm}
            onSwitchToEdit={() => setLinkFormMode("edit")}
            onSwitchToView={() => setLinkFormMode("view")}
            onSaved={reloadActions}
          />
        </>
      ) : null}
    </div>
  );
}
