import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { requestOpenFeedback } from "../../utils/feedbackOpen";
import {
  badgeClassForRetourType,
  prenomFromAuteur,
  type RetourKanbanItem,
} from "../../utils/retoursKanban";

type WelcomeFeedbackColumnProps = {
  items: RetourKanbanItem[];
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

function FeedbackCard({ item }: { item: RetourKanbanItem }) {
  const message =
    item.message.length > 160 ? `${item.message.slice(0, 157).trimEnd()}…` : item.message;
  const meta = [prenomFromAuteur(item.auteur), item.dateLabel].filter(Boolean).join(" · ");

  return (
    <li className="welcome-kanban__card">
      <div className="welcome-roadmap__item-head">
        <Badge small as="span" className={badgeClassForRetourType(item.type)}>
          {item.type}
        </Badge>
        {item.statut ? (
          <Badge small as="span">
            {item.statut}
          </Badge>
        ) : null}
      </div>
      {message ? <p className="fr-text--sm fr-mb-1w fr-mt-1w">{message}</p> : null}
      {meta ? <p className="fr-text--xs fr-mb-0 fr-hint-text">{meta}</p> : null}
    </li>
  );
}

/**
 * Colonne kanban « Feedback » (1ʳᵉ position).
 * Placeholder d’invitation toujours affiché ; liste des `Retours` en dessous s’il y en a.
 */
export function WelcomeFeedbackColumn({ items }: WelcomeFeedbackColumnProps) {
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
          aria-label={`Feedback : ${items.length} retour${items.length === 1 ? "" : "s"}`}
        >
          {items.length}
        </Badge>
      </div>
      <FeedbackInvitePlaceholder />
      {items.length > 0 ? (
        <ul className="welcome-kanban__list fr-mb-0 fr-mt-2w">
          {items.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
