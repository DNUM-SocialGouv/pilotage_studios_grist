import { Badge } from "@codegouvfr/react-dsfr/Badge";
import {
  badgeClassForFeedbackType,
  KANBAN_STATUS_BADGE_CLASS,
  KANBAN_STATUS_LABEL,
  prenomFromAuteur,
  type KanbanTicket,
} from "../../utils/kanbanTickets";

const RESUME_MAX = 160;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export type KanbanCardProps = {
  item: KanbanTicket;
  onOpen: (item: KanbanTicket) => void;
};

/**
 * Carte kanban unifiée (Feedback + Produit) — même structure visuelle partout.
 * Titre · badge(s) · thème · résumé · méta (auteur · date) · Ouvrir.
 */
export function KanbanCard({ item, onOpen }: KanbanCardProps) {
  const resume = truncate(
    (item.resume || (item.nature === "Feedback" ? item.message : "")).trim(),
    RESUME_MAX,
  );
  const meta = [
    item.auteur && item.auteur !== "Anonyme" ? prenomFromAuteur(item.auteur) : "",
    item.dateLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="welcome-kanban__card">
      <button
        type="button"
        className="welcome-kanban__card-btn"
        onClick={() => onOpen(item)}
      >
        <div className="welcome-roadmap__item-head">
          <span className="welcome-roadmap__title">{item.title}</span>{" "}
          {item.nature === "Feedback" ? (
            <Badge small as="span" className={badgeClassForFeedbackType(item.type)}>
              {item.type}
            </Badge>
          ) : (
            <Badge small as="span" className={KANBAN_STATUS_BADGE_CLASS[item.status]}>
              {KANBAN_STATUS_LABEL[item.status]}
            </Badge>
          )}
        </div>
        {item.theme ? (
          <p className="fr-text--xs fr-mb-1w fr-hint-text">{item.theme}</p>
        ) : null}
        {resume ? <p className="fr-text--sm fr-mb-1w fr-mt-1w">{resume}</p> : null}
        {meta ? <p className="fr-text--xs fr-mb-0 fr-hint-text">{meta}</p> : null}
        <span className="welcome-kanban__card-open fr-mt-1w">Voir la fiche</span>
      </button>
    </li>
  );
}
