import { useEffect, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { KanbanCard } from "../components/welcome/KanbanCard";
import { TicketDrawer } from "../components/welcome/TicketDrawer";
import { WelcomeFeedbackColumn } from "../components/welcome/WelcomeFeedbackColumn";
import { useKanbanList } from "../hooks/useKanbanList";
import { subscribeKanbanReload } from "../utils/feedbackOpen";
import type { KanbanTicket } from "../utils/kanbanTickets";

/**
 * Feuille de route (kanban Feedback · Backlog · En cours · Livré).
 * Ouverte à tous les profils — hors `Page_*` (équivalent de l’ancien kanban d’accueil).
 */
export function FeuilleDeRoutePage() {
  const {
    feedbackItems,
    productGroups,
    status,
    error,
    reload,
  } = useKanbanList();
  const [ticket, setTicket] = useState<KanbanTicket | null>(null);

  useEffect(() => subscribeKanbanReload(reload), [reload]);

  return (
    <div className="welcome-page">
      <div className="welcome-page__panel welcome-page__panel--wide">
        <section
          className="welcome-roadmap"
          aria-labelledby="feuille-de-route-title"
          id="feuille-de-route"
        >
          <h1 id="feuille-de-route-title" className="fr-h3">
            Feuille de route
          </h1>
          <p className="fr-text--sm fr-hint-text fr-mb-2w">
            Suivi commun Feedback · Backlog · En cours · Livré. Ouvrez une carte
            pour la conversation ; le bouton « Un retour ? » reste disponible ici.
          </p>

          {status === "error" ? (
            <Alert
              className="fr-mb-2w"
              severity="error"
              small
              title="Kanban indisponible"
              description={
                error
                  ? `Impossible de charger les tickets (${error}).`
                  : "Impossible de charger les tickets."
              }
            />
          ) : null}

          <div className="welcome-kanban fr-grid-row fr-grid-row--gutters">
            <WelcomeFeedbackColumn
              items={feedbackItems}
              status={status}
              onOpenTicket={setTicket}
            />
            {productGroups.map((group) => (
              <section
                key={group.column.id}
                className="welcome-kanban__column fr-col-12 fr-col-md-6 fr-col-xl-3"
                aria-labelledby={`feuille-de-route-kanban-${group.column.id}`}
              >
                <div className="welcome-kanban__column-head">
                  <h2
                    id={`feuille-de-route-kanban-${group.column.id}`}
                    className="fr-h6 welcome-kanban__column-title"
                  >
                    {group.column.label}
                  </h2>
                  <Badge
                    small
                    as="span"
                    aria-label={`${group.column.label} : ${
                      status === "loading" ? "…" : group.items.length
                    } élément${group.items.length === 1 ? "" : "s"}`}
                  >
                    {status === "loading" ? "…" : group.items.length}
                  </Badge>
                </div>
                {status === "loading" ? (
                  <p className="fr-text--sm fr-hint-text fr-mb-0" role="status">
                    Chargement…
                  </p>
                ) : null}
                <ul className="welcome-kanban__list fr-mb-0">
                  {group.items.map((item) => (
                    <KanbanCard key={item.id} item={item} onOpen={setTicket} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </div>

      <TicketDrawer
        ticket={ticket}
        onClose={() => setTicket(null)}
        onColumnChanged={() => {
          reload();
        }}
        onBodyChanged={(ticketId, body) => {
          setTicket((prev) =>
            prev && prev.id === ticketId
              ? { ...prev, resume: body.resume, message: body.message }
              : prev,
          );
          reload();
        }}
      />
    </div>
  );
}
