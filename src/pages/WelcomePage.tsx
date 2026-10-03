import { useEffect, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useAclProfil } from "../AclProfilContext";
import { KanbanCard } from "../components/welcome/KanbanCard";
import { TicketDrawer } from "../components/welcome/TicketDrawer";
import { WelcomeFeedbackColumn } from "../components/welcome/WelcomeFeedbackColumn";
import { WelcomeRoleHome } from "../components/welcome/WelcomeRoleHome";
import { useKanbanList } from "../hooks/useKanbanList";
import { subscribeKanbanReload } from "../utils/feedbackOpen";
import type { KanbanTicket } from "../utils/kanbanTickets";
import {
  buildWelcomeHome,
  welcomeAccessFromSession,
} from "../utils/welcomeHomeByRole";

export function WelcomePage() {
  const {
    feedbackItems,
    productGroups,
    status,
    error,
    reload,
  } = useKanbanList();
  const [ticket, setTicket] = useState<KanbanTicket | null>(null);
  const {
    status: aclStatus,
    role,
    flags,
    equipeLabel,
  } = useAclProfil();

  useEffect(() => subscribeKanbanReload(reload), [reload]);

  const homeLoading = aclStatus === "loading";
  const homeContent = homeLoading
    ? null
    : buildWelcomeHome({
        role,
        status: aclStatus,
        equipeLabel,
        access: welcomeAccessFromSession({
          role,
          status: aclStatus,
          flags,
          equipeLabel,
          // Route `/feuille-de-route` = PR-B ; kanban reste sous les CTA (transitoire).
          includeFeuilleDeRoute: false,
        }),
      });

  return (
    <div className="welcome-page">
      <div className="welcome-page__panel welcome-page__panel--wide">
        {homeLoading || !homeContent ? (
          <WelcomeRoleHome
            content={{
              kind: "unknown",
              title: "Bonjour",
              roleLabel: null,
              lead: "",
              hint: null,
              ctas: [],
            }}
            loading
          />
        ) : (
          <WelcomeRoleHome content={homeContent} />
        )}

        <section
          className="welcome-roadmap fr-mt-3w"
          aria-labelledby="welcome-roadmap-title"
          id="welcome-roadmap"
        >
          <h2 id="welcome-roadmap-title" className="fr-h5">
            Feuille de route
          </h2>
          <p className="fr-text--sm fr-hint-text fr-mb-2w">
            Affichage temporaire sur l’accueil — une page dédiée arrivera avec le
            menu utilisateur.
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
      />
    </div>
  );
}
