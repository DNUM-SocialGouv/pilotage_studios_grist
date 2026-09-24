import { useEffect, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Factory from "@codegouvfr/react-dsfr/picto/Factory";
import { TicketDrawer } from "../components/welcome/TicketDrawer";
import { WelcomeFeedbackColumn } from "../components/welcome/WelcomeFeedbackColumn";
import { useKanbanList } from "../hooks/useKanbanList";
import { subscribeKanbanReload } from "../utils/feedbackOpen";
import {
  badgeClassForFeedbackType,
  KANBAN_STATUS_BADGE_CLASS,
  KANBAN_STATUS_LABEL,
  type KanbanTicket,
} from "../utils/kanbanTickets";

export function WelcomePage() {
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
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-sm-7">
            <h1 className="fr-h3">Pilotage studios</h1>
          </div>
          <div className="fr-col-12 fr-col-sm-5">
            <div className="welcome-artwork" aria-hidden="true">
              <Factory fontSize="7rem" color="blue-ecume" />
            </div>
          </div>
        </div>

        <section className="welcome-roadmap fr-mt-3w" aria-labelledby="welcome-roadmap-title">
          <h2 id="welcome-roadmap-title" className="fr-h5">
            Feuille de route
          </h2>

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
                aria-labelledby={`welcome-kanban-${group.column.id}`}
              >
                <div className="welcome-kanban__column-head">
                  <h3
                    id={`welcome-kanban-${group.column.id}`}
                    className="fr-h6 welcome-kanban__column-title"
                  >
                    {group.column.label}
                  </h3>
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
                    <li key={item.id} className="welcome-kanban__card">
                      <button
                        type="button"
                        className="welcome-kanban__card-btn"
                        onClick={() => setTicket(item)}
                      >
                        <div className="welcome-roadmap__item-head">
                          <span className="welcome-roadmap__title">{item.title}</span>{" "}
                          {item.nature === "Feedback" ? (
                            <Badge
                              small
                              as="span"
                              className={badgeClassForFeedbackType(item.type)}
                            >
                              {item.type}
                            </Badge>
                          ) : (
                            <Badge
                              small
                              as="span"
                              className={KANBAN_STATUS_BADGE_CLASS[item.status]}
                            >
                              {KANBAN_STATUS_LABEL[item.status]}
                            </Badge>
                          )}
                        </div>
                        {item.theme ? (
                          <p className="fr-text--xs fr-mb-1w fr-hint-text">{item.theme}</p>
                        ) : null}
                        {item.resume ? (
                          <p className="fr-text--sm fr-mb-1w">{item.resume}</p>
                        ) : null}
                        <span className="fr-link fr-link--sm">Ouvrir</span>
                      </button>
                    </li>
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
      />
    </div>
  );
}
