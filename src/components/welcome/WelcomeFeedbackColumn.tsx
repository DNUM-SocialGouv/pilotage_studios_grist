import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import type { KanbanListStatus } from "../../hooks/useKanbanList";
import { requestOpenFeedback } from "../../utils/feedbackOpen";
import {
  badgeClassForFeedbackType,
  prenomFromAuteur,
  type KanbanTicket,
} from "../../utils/kanbanTickets";

type WelcomeFeedbackColumnProps = {
  items: KanbanTicket[];
  status: KanbanListStatus;
  error: string | null;
  onOpenTicket: (item: KanbanTicket) => void;
};

/** Placeholder toujours visible (même s’il y a déjà des tickets). */
function FeedbackInvitePlaceholder() {
  return (
    <div className="welcome-feedback-empty">
      <div className="welcome-feedback-empty__pictogram" aria-hidden="true">
        <span className="fr-icon-chat-3-line" />
      </div>
      <p className="fr-mb-1w welcome-feedback-empty__title">Un retour à partager&nbsp;?</p>
      <p className="fr-text--sm fr-hint-text fr-mb-2w">Bug, idée ou question</p>
      <Button
        priority="secondary"
        size="small"
        type="button"
        iconId="fr-icon-chat-3-line"
        onClick={() => requestOpenFeedback()}
      >
        Gimme
      </Button>
    </div>
  );
}

function FeedbackCard({
  item,
  onOpen,
}: {
  item: KanbanTicket;
  onOpen: (item: KanbanTicket) => void;
}) {
  const body = item.resume || item.message;
  const message =
    body.length > 160 ? `${body.slice(0, 157).trimEnd()}…` : body;
  const meta = [prenomFromAuteur(item.auteur), item.dateLabel].filter(Boolean).join(" · ");

  return (
    <li className="welcome-kanban__card">
      <button
        type="button"
        className="welcome-kanban__card-btn"
        onClick={() => onOpen(item)}
      >
        <div className="welcome-roadmap__item-head">
          <Badge small as="span" className={badgeClassForFeedbackType(item.type)}>
            {item.type}
          </Badge>
          {item.statutFeedback ? (
            <Badge small as="span">
              {item.statutFeedback}
            </Badge>
          ) : null}
        </div>
        {message ? <p className="fr-text--sm fr-mb-1w fr-mt-1w">{message}</p> : null}
        {meta ? <p className="fr-text--xs fr-mb-0 fr-hint-text">{meta}</p> : null}
        <span className="fr-link fr-link--sm fr-mt-1w">Ouvrir</span>
      </button>
    </li>
  );
}

/**
 * Colonne kanban « Feedback » (1ʳᵉ position).
 * Placeholder d’invitation toujours affiché ; tickets `Nature=Feedback` en dessous.
 */
export function WelcomeFeedbackColumn({
  items,
  status,
  error,
  onOpenTicket,
}: WelcomeFeedbackColumnProps) {
  const count = status === "loading" || status === "error" ? 0 : items.length;

  return (
    <section
      className="welcome-kanban__column fr-col-12 fr-col-md-6 fr-col-xl-3"
      aria-labelledby="welcome-kanban-feedback"
    >
      <div className="welcome-kanban__column-head">
        <h3 id="welcome-kanban-feedback" className="fr-h6 welcome-kanban__column-title">
          Feedback
        </h3>
        <Badge
          small
          as="span"
          aria-label={`Feedback : ${count} retour${count === 1 ? "" : "s"}`}
        >
          {status === "loading" ? "…" : count}
        </Badge>
      </div>
      <FeedbackInvitePlaceholder />
      {status === "error" ? (
        <Alert
          className="fr-mt-2w"
          severity="error"
          small
          title="Retours indisponibles"
          description={
            error
              ? `Impossible de charger la liste des retours (${error}).`
              : "Impossible de charger la liste des retours."
          }
        />
      ) : null}
      {status === "loading" ? (
        <p className="fr-text--sm fr-hint-text fr-mt-2w fr-mb-0" role="status">
          Chargement des retours…
        </p>
      ) : null}
      {items.length > 0 ? (
        <ul className="welcome-kanban__list fr-mb-0 fr-mt-2w">
          {items.map((item) => (
            <FeedbackCard key={item.id} item={item} onOpen={onOpenTicket} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
