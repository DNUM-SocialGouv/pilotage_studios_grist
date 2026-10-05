import type { MouseEvent, RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import type { VosRetoursStatus } from "../../hooks/useVosRetours";
import { requestOpenFeedback } from "../../utils/feedbackOpen";
import type { KanbanTicket } from "../../utils/kanbanTickets";
import type { VosRetourItem } from "../../utils/vosRetours";

export type VosRetoursSectionProps = {
  status: VosRetoursStatus;
  items: VosRetourItem[];
  error: string | null;
  onOpenTicket: (ticket: KanbanTicket) => void;
  /** Refs des boutons liste — restauration focus après fermeture drawer. */
  itemButtonRefs: RefObject<Map<number, HTMLButtonElement>>;
};

function truncateTitle(title: string, max = 72): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Bloc « Vos retours » — liste compacte (5) ou placeholder + CTA (esprit Feedback).
 */
export function VosRetoursSection({
  status,
  items,
  error,
  onOpenTicket,
  itemButtonRefs,
}: VosRetoursSectionProps) {
  const navigate = useNavigate();
  const count =
    status === "loading" || status === "error" || status === "standalone"
      ? 0
      : items.length;

  const goFeuilleDeRoute = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/feuille-de-route");
  };

  return (
    <section
      className="welcome-vos-retours"
      aria-labelledby="vos-retours-title"
    >
      <div className="welcome-vos-retours__head">
        <h2 id="vos-retours-title" className="fr-h5 welcome-vos-retours__title">
          Vos retours
        </h2>
        <Badge
          small
          as="span"
          aria-label={`Vos retours : ${count} carte${count === 1 ? "" : "s"}`}
        >
          {status === "loading" ? "…" : count}
        </Badge>
      </div>

      {status === "loading" ? (
        <p className="fr-text--sm fr-hint-text fr-mb-0" role="status">
          Chargement de vos retours…
        </p>
      ) : null}

      {status === "error" ? (
        <Alert
          className="fr-mb-2w"
          severity="error"
          small
          title="Retours indisponibles"
          description={
            error
              ? `Impossible de charger vos retours (${error}). Consultez la feuille de route.`
              : "Impossible de charger vos retours. Consultez la feuille de route."
          }
        />
      ) : null}

      {status === "standalone" ? (
        <p className="fr-text--sm fr-hint-text fr-mb-2w">
          Vos retours sont disponibles dans le widget Grist.
        </p>
      ) : null}

      {status === "empty" || (status === "ok" && items.length === 0) ? (
        <div className="welcome-vos-retours__empty">
          <p className="fr-mb-1w">
            Aucun retour de votre part pour l’instant.
          </p>
          <p className="fr-text--sm fr-hint-text fr-mb-2w">
            Bug, idée ou question — dites-le à l’équipe.
          </p>
          <Button
            priority="secondary"
            size="small"
            type="button"
            iconId="fr-icon-chat-3-line"
            onClick={() => requestOpenFeedback()}
          >
            Un retour&nbsp;?
          </Button>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="welcome-vos-retours__list fr-mb-0">
          {items.map((item) => (
            <li key={item.ticket.id} className="welcome-vos-retours__item">
              <button
                type="button"
                className="welcome-vos-retours__item-btn"
                ref={(el) => {
                  const map = itemButtonRefs.current;
                  if (!map) return;
                  if (el) map.set(item.ticket.id, el);
                  else map.delete(item.ticket.id);
                }}
                onClick={() => onOpenTicket(item.ticket)}
              >
                {item.noveltyLabel ? (
                  <span
                    className={
                      item.novelty === "nouvelle_reponse"
                        ? "welcome-vos-retours__novelty welcome-vos-retours__novelty--reply"
                        : "welcome-vos-retours__novelty welcome-vos-retours__novelty--updated"
                    }
                  >
                    {item.noveltyLabel}
                  </span>
                ) : null}
                <span className="welcome-vos-retours__item-title">
                  {truncateTitle(item.ticket.title)}
                </span>
                <span className="welcome-vos-retours__item-meta fr-text--sm fr-hint-text">
                  <Badge small as="span">
                    {item.columnLabel}
                  </Badge>
                  {item.relativeDate ? (
                    <span aria-hidden="true"> · </span>
                  ) : null}
                  {item.relativeDate ? (
                    <span>{item.relativeDate}</span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="welcome-vos-retours__footer fr-mt-2w">
        <Button
          priority="tertiary"
          size="small"
          linkProps={{
            href: "/feuille-de-route",
            onClick: goFeuilleDeRoute,
          }}
        >
          Voir la feuille de route
        </Button>
      </div>
    </section>
  );
}
