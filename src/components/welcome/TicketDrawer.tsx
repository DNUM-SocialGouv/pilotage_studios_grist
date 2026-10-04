import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useAclProfil } from "../../AclProfilContext";
import { isAdminRole } from "../../utils/droitsPagesThemes";
import {
  badgeClassForFeedbackType,
  isKanbanColumnId,
  KANBAN_ALL_COLUMNS,
  KANBAN_COLUMN_LABEL,
  KANBAN_STATUS_BADGE_CLASS,
  KANBAN_STATUS_LABEL,
  type KanbanColumnId,
  type KanbanTicket,
} from "../../utils/kanbanTickets";
import { safeHttpUrl } from "../../utils/produitsList";
import { updateKanbanBody } from "../../utils/updateKanbanBody";
import { updateKanbanColonne } from "../../utils/updateKanbanColonne";
import { MissionProse } from "../missions/MissionProse";
import { TicketConversation } from "./TicketConversation";

export type TicketBodyPatch = {
  resume: string;
  message: string;
};

export type TicketDrawerProps = {
  ticket: KanbanTicket | null;
  onClose: () => void;
  /** Après changement de colonne Admin — rafraîchir la liste. */
  onColumnChanged?: (ticketId: number, column: KanbanColumnId) => void;
  /** Après édition Résumé / Détail Admin — sync ticket ouvert + liste. */
  onBodyChanged?: (ticketId: number, body: TicketBodyPatch) => void;
};

type MetaChip = { label: string; value: string };

/** Pastilles méta — sans Type/Statut (déjà en badges d’en-tête). */
function buildMetaChips(ticket: KanbanTicket): MetaChip[] {
  const chips: MetaChip[] = [];
  if (ticket.theme) {
    chips.push({ label: "Thème", value: ticket.theme });
  }
  if (ticket.nature === "Feedback") {
    if (ticket.page) chips.push({ label: "Page", value: ticket.page });
    if (ticket.auteur) chips.push({ label: "Auteur", value: ticket.auteur });
    if (ticket.niveauGene) {
      chips.push({ label: "Niveau de gêne", value: ticket.niveauGene });
    }
    if (ticket.dateLabel) chips.push({ label: "Date", value: ticket.dateLabel });
  }
  return chips;
}

export function TicketDrawer({
  ticket,
  onClose,
  onColumnChanged,
  onBodyChanged,
}: TicketDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const columnSelectId = useId();
  const resumeFieldId = useId();
  const detailFieldId = useId();
  const navigate = useNavigate();
  const { status: aclStatus, role } = useAclProfil();
  const isAdmin = aclStatus === "standalone" || isAdminRole(role);

  const [localColumn, setLocalColumn] = useState<KanbanColumnId | null>(null);
  const [savingColumn, setSavingColumn] = useState(false);
  const [columnError, setColumnError] = useState<string | null>(null);

  const [localResume, setLocalResume] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState(false);
  const [draftResume, setDraftResume] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [savingBody, setSavingBody] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);

  useEffect(() => {
    setLocalColumn(ticket?.column ?? null);
    setColumnError(null);
    setSavingColumn(false);
    setLocalResume(null);
    setLocalMessage(null);
    setEditingBody(false);
    setDraftResume("");
    setDraftMessage("");
    setSavingBody(false);
    setBodyError(null);
  }, [ticket?.id, ticket?.column]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || ticket == null) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
  }, [ticket]);

  const close = () => {
    dialogRef.current?.close();
  };

  const goToPage = (path: string) => {
    navigate(path);
    close();
  };

  const displayColumn = localColumn ?? ticket?.column ?? "backlog";
  const title = ticket?.title ?? "Ticket";
  const githubHref = ticket?.lienGithub ? safeHttpUrl(ticket.lienGithub) : undefined;

  const storedResume = localResume ?? ticket?.resume ?? "";
  const storedMessage = localMessage ?? ticket?.message ?? "";

  const resumeText =
    storedResume ||
    (ticket?.nature === "Produit" ? ticket.guideLead : "") ||
    (ticket?.nature === "Feedback" ? storedMessage : "") ||
    "";

  const detailText =
    storedMessage && storedMessage !== resumeText ? storedMessage : "";

  const hasPratique =
    Boolean(ticket?.guideIntro) || (ticket?.guideSteps.length ?? 0) > 0;

  const metaChips = ticket ? buildMetaChips(ticket) : [];
  const hasActions = Boolean(ticket?.pagePath) || Boolean(githubHref);
  const hasBodyContent = Boolean(resumeText) || Boolean(detailText);

  const startBodyEdit = () => {
    if (!ticket || !isAdmin || savingBody) {
      return;
    }
    // Formulaire = colonnes Grist ; si Message == Resume (create Feedback), Détail vide.
    setDraftResume(storedResume);
    setDraftMessage(storedMessage && storedMessage !== storedResume ? storedMessage : "");
    setBodyError(null);
    setEditingBody(true);
  };

  const cancelBodyEdit = () => {
    if (savingBody) {
      return;
    }
    setEditingBody(false);
    setBodyError(null);
  };

  const saveBodyEdit = async () => {
    if (!ticket || !isAdmin || savingBody) {
      return;
    }
    setSavingBody(true);
    setBodyError(null);
    try {
      const fields = await updateKanbanBody(
        ticket.id,
        { resume: draftResume, message: draftMessage },
        { isAdmin: true },
      );
      setLocalResume(fields.Resume);
      setLocalMessage(fields.Message);
      setEditingBody(false);
      onBodyChanged?.(ticket.id, {
        resume: fields.Resume,
        message: fields.Message,
      });
    } catch (err) {
      setBodyError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingBody(false);
    }
  };

  const onColumnSelect = async (raw: string) => {
    if (!ticket || !isAdmin || savingColumn) {
      return;
    }
    if (!isKanbanColumnId(raw) || raw === displayColumn) {
      return;
    }
    setSavingColumn(true);
    setColumnError(null);
    try {
      await updateKanbanColonne(ticket.id, raw, ticket.nature, { isAdmin: true });
      setLocalColumn(raw);
      onColumnChanged?.(ticket.id, raw);
    } catch (err) {
      setColumnError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingColumn(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-drawer-dialog pilotage-drawer-dialog--sm"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="pilotage-drawer-dialog__shell">
        <div className="pilotage-drawer-dialog__scrim" aria-hidden="true" onClick={close} />
        <div className="pilotage-drawer-dialog__panel">
          <div className="pilotage-drawer-dialog__inner">
            <header className="ticket-drawer-header">
              <div className="ticket-drawer-header__top">
                <div className="ticket-drawer-header__main">
                  {ticket ? (
                    <p className="ticket-drawer-header__badges fr-mb-1w">
                      <Badge
                        small
                        as="span"
                        className={
                          ticket.nature === "Feedback"
                            ? "fr-badge--purple-glycine"
                            : "fr-badge--blue-cumulus"
                        }
                      >
                        {ticket.nature}
                      </Badge>
                      {/* Évite Feedback + Feedback quand colonne = nature. */}
                      {!isAdmin &&
                      !(ticket.nature === "Feedback" && displayColumn === "feedback") ? (
                        <Badge small as="span">
                          {KANBAN_COLUMN_LABEL[displayColumn]}
                        </Badge>
                      ) : null}
                      {ticket.nature === "Produit" ? (
                        <Badge
                          small
                          as="span"
                          className={KANBAN_STATUS_BADGE_CLASS[ticket.status]}
                        >
                          {KANBAN_STATUS_LABEL[ticket.status]}
                        </Badge>
                      ) : null}
                      {ticket.nature === "Feedback" && ticket.type ? (
                        <Badge
                          small
                          as="span"
                          className={badgeClassForFeedbackType(ticket.type)}
                        >
                          {ticket.type}
                        </Badge>
                      ) : null}
                    </p>
                  ) : null}
                  <h2 id={titleId} className="fr-h5 fr-mb-0">
                    {title}
                  </h2>
                </div>
                <button
                  type="button"
                  className="fr-btn--close fr-btn"
                  title="Fermer"
                  onClick={close}
                >
                  Fermer
                </button>
              </div>

              {isAdmin && ticket ? (
                <div className="ticket-drawer-colonne-row">
                  <Select
                    label="Colonne"
                    nativeSelectProps={{
                      id: columnSelectId,
                      value: displayColumn,
                      disabled: savingColumn,
                      onChange: (e) => {
                        void onColumnSelect(e.target.value);
                      },
                    }}
                  >
                    {KANBAN_ALL_COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}

              {columnError ? (
                <Alert
                  className="fr-mt-2w"
                  severity="error"
                  small
                  title="Changement de colonne impossible"
                  description={columnError}
                />
              ) : null}
            </header>

            {ticket ? (
              <div className="pilotage-drawer-dialog__body ticket-drawer-body">
                {isAdmin ? (
                  <div className="ticket-drawer-body-toolbar">
                    <p className="ticket-drawer-body-toolbar__title fr-mb-0">Contenu</p>
                    {!editingBody ? (
                      <button
                        type="button"
                        className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
                        onClick={startBodyEdit}
                      >
                        {hasBodyContent ? "Modifier" : "Ajouter"}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {editingBody ? (
                  <div className="ticket-drawer-body-edit">
                    <Input
                      label="Résumé"
                      hintText="Phrase courte affichée sur la carte et en tête du panneau."
                      textArea
                      state={bodyError && !draftResume.trim() ? "error" : "default"}
                      stateRelatedMessage={
                        bodyError && !draftResume.trim() ? bodyError : undefined
                      }
                      nativeTextAreaProps={{
                        id: resumeFieldId,
                        value: draftResume,
                        rows: 3,
                        disabled: savingBody,
                        "aria-required": true,
                        onChange: (e) => setDraftResume(e.target.value),
                      }}
                    />
                    <Input
                      label="Détail"
                      hintText="Optionnel. Markdown léger (titres, listes, liens http(s) ou page interne). Ex. [Documentation](/outils/regles-metier)."
                      textArea
                      nativeTextAreaProps={{
                        id: detailFieldId,
                        value: draftMessage,
                        rows: ticket.nature === "Produit" ? 8 : 5,
                        disabled: savingBody,
                        onChange: (e) => setDraftMessage(e.target.value),
                      }}
                    />
                    {bodyError && draftResume.trim() ? (
                      <Alert
                        className="fr-mb-2w"
                        severity="error"
                        small
                        title="Enregistrement impossible"
                        description={bodyError}
                      />
                    ) : null}
                    <div className="ticket-drawer-body-edit__actions">
                      <button
                        type="button"
                        className="fr-btn fr-btn--sm"
                        onClick={() => void saveBodyEdit()}
                        disabled={savingBody}
                      >
                        {savingBody ? "Enregistrement…" : "Enregistrer"}
                      </button>
                      <button
                        type="button"
                        className="fr-btn fr-btn--secondary fr-btn--sm"
                        onClick={cancelBodyEdit}
                        disabled={savingBody}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {resumeText ? (
                      <section
                        className="ticket-drawer-section"
                        aria-labelledby="ticket-resume-title"
                      >
                        <p id="ticket-resume-title" className="ticket-drawer-label">
                          Résumé
                        </p>
                        <p
                          className="ticket-drawer-lead fr-mb-0"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          <MissionProse
                            value={resumeText}
                            inline
                            onInternalLinkClick={close}
                          />
                        </p>
                      </section>
                    ) : isAdmin ? (
                      <p className="fr-text--sm fr-hint-text fr-mb-0">
                        Aucun résumé — utilisez « Ajouter » pour renseigner le contenu.
                      </p>
                    ) : null}

                    {detailText ? (
                      <section
                        className="ticket-drawer-section"
                        aria-labelledby="ticket-detail-title"
                      >
                        <p id="ticket-detail-title" className="ticket-drawer-label">
                          Détail
                        </p>
                        <div className="ticket-drawer-detail">
                          <MissionProse
                            value={detailText}
                            onInternalLinkClick={close}
                          />
                        </div>
                      </section>
                    ) : null}
                  </>
                )}

                {hasPratique ? (
                  <section
                    className="ticket-drawer-pratique"
                    aria-labelledby="ticket-pratique-title"
                  >
                    <h3 id="ticket-pratique-title" className="fr-text--sm fr-mb-1w">
                      En pratique
                    </h3>
                    {ticket.guideIntro ? (
                      <p className="fr-text--sm fr-hint-text fr-mb-2w">
                        {ticket.guideIntro}
                      </p>
                    ) : null}
                    {ticket.guideSteps.length > 0 ? (
                      <ul className="ticket-drawer-pratique__steps fr-mb-0">
                        {ticket.guideSteps.map((step, index) => (
                          <li key={`${index}-${step}`}>
                            <span className="ticket-drawer-pratique__num" aria-hidden="true">
                              {index + 1}
                            </span>
                            <span className="ticket-drawer-pratique__text">{step}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ) : null}

                {metaChips.length > 0 ? (
                  <ul className="ticket-drawer-meta" aria-label="Informations">
                    {metaChips.map((chip) => (
                      <li key={chip.label} className="ticket-drawer-meta__chip">
                        <span className="ticket-drawer-meta__label">{chip.label}</span>
                        <span className="ticket-drawer-meta__value">{chip.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {hasActions ? (
                  <p className="ticket-drawer-actions fr-mb-0">
                    {ticket.pagePath ? (
                      <Link
                        className="fr-link fr-link--sm"
                        to={ticket.pagePath}
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(ticket.pagePath);
                        }}
                      >
                        {ticket.pageLinkLabel || "Ouvrir la page"}
                      </Link>
                    ) : null}
                    {githubHref ? (
                      <a
                        className="fr-link fr-link--sm"
                        href={githubHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Voir sur GitHub
                        <span className="fr-sr-only">
                          {" "}
                          (nouvelle fenêtre) — {ticket.title}
                        </span>
                      </a>
                    ) : null}
                  </p>
                ) : null}

                <TicketConversation cibleId={ticket.id} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
