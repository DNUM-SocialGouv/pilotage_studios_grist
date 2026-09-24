import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useAclProfil } from "../../AclProfilContext";
import { TableShell } from "../FinanceRecap";
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
import { TicketConversation } from "./TicketConversation";

export type TicketDrawerProps = {
  ticket: KanbanTicket | null;
  onClose: () => void;
  /** Après changement de colonne Admin — rafraîchir la liste. */
  onColumnChanged?: (ticketId: number, column: KanbanColumnId) => void;
};

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

  const metaRows: { label: string; value: string }[] = [];
  if (ticket?.theme) {
    metaRows.push({ label: "Thème", value: ticket.theme });
  }
  if (ticket?.nature === "Feedback") {
    if (ticket.type) metaRows.push({ label: "Type", value: ticket.type });
    if (ticket.page) metaRows.push({ label: "Page", value: ticket.page });
    if (ticket.auteur) metaRows.push({ label: "Auteur", value: ticket.auteur });
    if (ticket.niveauGene) {
      metaRows.push({ label: "Niveau de gêne", value: ticket.niveauGene });
    }
    if (ticket.dateLabel) metaRows.push({ label: "Date", value: ticket.dateLabel });
  }

  const valeurWhy =
    ticket?.resume ||
    (ticket?.nature === "Feedback" ? ticket.message : "") ||
    ticket?.guideLead ||
    "";

  const hasPratique =
    Boolean(ticket?.guideIntro) || (ticket?.guideSteps.length ?? 0) > 0;

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
            <header className="fr-p-3w fr-pb-2w">
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                <div className="fr-col">
                  <h2 id={titleId} className="fr-h5 fr-mb-1w">
                    {title}
                  </h2>
                  {isAdmin && ticket ? (
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
                  ) : ticket ? (
                    <p className="fr-text--sm fr-mb-0">
                      <Badge small as="span">
                        {KANBAN_COLUMN_LABEL[displayColumn]}
                      </Badge>
                      {ticket.nature === "Produit" ? (
                        <>
                          {" "}
                          <Badge
                            small
                            as="span"
                            className={KANBAN_STATUS_BADGE_CLASS[ticket.status]}
                          >
                            {KANBAN_STATUS_LABEL[ticket.status]}
                          </Badge>
                        </>
                      ) : null}
                      {ticket.nature === "Feedback" && ticket.type ? (
                        <>
                          {" "}
                          <Badge
                            small
                            as="span"
                            className={badgeClassForFeedbackType(ticket.type)}
                          >
                            {ticket.type}
                          </Badge>
                        </>
                      ) : null}
                    </p>
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
                </div>
                <div className="fr-col-auto">
                  <button
                    type="button"
                    className="fr-btn--close fr-btn"
                    title="Fermer"
                    onClick={close}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </header>

            {ticket ? (
              <div className="pilotage-drawer-dialog__body roadmap-guide fr-px-3w fr-pb-3w fr-pt-0">
                {valeurWhy ? (
                  <section className="fr-mb-3w" aria-labelledby="ticket-valeur-title">
                    <h3 id="ticket-valeur-title" className="fr-h6">
                      Valeur
                    </h3>
                    <p
                      className="roadmap-guide__lead fr-mb-0"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {valeurWhy}
                    </p>
                  </section>
                ) : null}

                {hasPratique ? (
                  <section className="fr-mb-3w" aria-labelledby="ticket-pratique-title">
                    <h3 id="ticket-pratique-title" className="fr-h6">
                      En pratique
                    </h3>
                    {ticket.guideIntro ? (
                      <p className="fr-text--sm fr-mb-1w">{ticket.guideIntro}</p>
                    ) : null}
                    {ticket.guideSteps.length > 0 ? (
                      <ul className="roadmap-guide__steps fr-mb-0">
                        {ticket.guideSteps.map((step) => (
                          <li key={step}>
                            <span className="roadmap-guide__step">{step}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {ticket.pagePath ? (
                      <p className="fr-mt-2w fr-mb-0">
                        <Link
                          className="fr-link"
                          to={ticket.pagePath}
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(ticket.pagePath);
                          }}
                        >
                          {ticket.pageLinkLabel || "Ouvrir la page"}
                        </Link>
                      </p>
                    ) : null}
                  </section>
                ) : ticket.pagePath ? (
                  <p className="fr-mb-3w">
                    <Link
                      className="fr-link"
                      to={ticket.pagePath}
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(ticket.pagePath);
                      }}
                    >
                      {ticket.pageLinkLabel || "Ouvrir la page"}
                    </Link>
                  </p>
                ) : null}

                {metaRows.length > 0 ? (
                  <section className="fr-mb-3w" aria-labelledby="ticket-meta-title">
                    <h3 id="ticket-meta-title" className="fr-h6">
                      Informations
                    </h3>
                    <TableShell className="fr-mb-0" size="sm">
                      <table>
                        <caption className="fr-sr-only">Métadonnées du ticket</caption>
                        <tbody>
                          {metaRows.map((row) => (
                            <tr key={row.label}>
                              <th scope="row">{row.label}</th>
                              <td>{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TableShell>
                  </section>
                ) : null}

                {githubHref ? (
                  <p className="fr-mb-3w">
                    <a
                      className="fr-link"
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
                  </p>
                ) : null}

                <hr className="fr-hr fr-mt-1w fr-mb-1w" />

                <TicketConversation cibleId={ticket.id} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
