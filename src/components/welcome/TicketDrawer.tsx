import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
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
import { updateKanbanColonne } from "../../utils/updateKanbanColonne";
import { MissionProse } from "../missions/MissionProse";
import { TicketConversation } from "./TicketConversation";

export type TicketDrawerProps = {
  ticket: KanbanTicket | null;
  onClose: () => void;
  /** Après changement de colonne Admin — rafraîchir la liste. */
  onColumnChanged?: (ticketId: number, column: KanbanColumnId) => void;
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

export function TicketDrawer({ ticket, onClose, onColumnChanged }: TicketDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const columnSelectId = useId();
  const navigate = useNavigate();
  const { status: aclStatus, role } = useAclProfil();
  const isAdmin = aclStatus === "standalone" || isAdminRole(role);

  const [localColumn, setLocalColumn] = useState<KanbanColumnId | null>(null);
  const [savingColumn, setSavingColumn] = useState(false);
  const [columnError, setColumnError] = useState<string | null>(null);

  useEffect(() => {
    setLocalColumn(ticket?.column ?? null);
    setColumnError(null);
    setSavingColumn(false);
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

  const resumeText =
    ticket?.resume ||
    (ticket?.nature === "Produit" ? ticket.guideLead : "") ||
    (ticket?.nature === "Feedback" ? ticket.message : "") ||
    "";

  const detailText =
    ticket?.message && ticket.message !== resumeText ? ticket.message : "";

  const hasPratique =
    Boolean(ticket?.guideIntro) || (ticket?.guideSteps.length ?? 0) > 0;

  const metaChips = ticket ? buildMetaChips(ticket) : [];
  const hasActions = Boolean(ticket?.pagePath) || Boolean(githubHref);

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
                      {resumeText}
                    </p>
                  </section>
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
                      <MissionProse value={detailText} />
                    </div>
                  </section>
                ) : null}

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
