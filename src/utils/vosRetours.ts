/**
 * Bloc « Vos retours » (accueil) — filtre auteur session + signaux nouveauté.
 * Pas de colonne Grist lu/non-lu : `lastSeen` = localStorage.
 */

import { formatRelativeDateFr } from "./formatRelativeDateFr.ts";
import type { KanbanCommentaireItem } from "./kanbanCommentaires.ts";
import {
  KANBAN_COLUMN_LABEL,
  type KanbanColumnId,
  type KanbanTicket,
} from "./kanbanTickets.ts";
import type { VosRetoursLastSeenMap } from "./vosRetoursLastSeen.ts";

export const VOS_RETOURS_LIST_LIMIT = 5;

export type VosRetourNovelty = "nouvelle_reponse" | "mis_a_jour" | null;

export type VosRetourItem = {
  ticket: KanbanTicket;
  novelty: VosRetourNovelty;
  noveltyLabel: string | null;
  columnLabel: string;
  relativeDate: string;
  /** Epoch ms pour tri (activité récente). */
  activityAt: number;
};

function normalizeEmail(value: string | null | undefined): string | null {
  const s = value?.trim().toLowerCase() ?? "";
  if (!s.includes("@")) return null;
  return s;
}

/** Tickets Feedback dont l’e-mail auteur = session (toute colonne). */
export function filterMesRetoursFeedback(
  tickets: readonly KanbanTicket[],
  sessionEmail: string | null | undefined,
): KanbanTicket[] {
  const want = normalizeEmail(sessionEmail);
  if (!want) return [];
  return tickets.filter(
    (t) => t.nature === "Feedback" && normalizeEmail(t.email) === want,
  );
}

function commentsForTicket(
  comments: readonly KanbanCommentaireItem[],
  ticketId: number,
): KanbanCommentaireItem[] {
  return comments.filter((c) => c.cibleId === ticketId);
}

/** Commentaire dont l’e-mail ≠ auteur du ticket (self = même e-mail). */
function isCommentFromOther(
  ticket: KanbanTicket,
  comment: KanbanCommentaireItem,
): boolean {
  const authorEmail = normalizeEmail(ticket.email);
  const commentEmail = normalizeEmail(comment.email);
  if (authorEmail && commentEmail) {
    return commentEmail !== authorEmail;
  }
  /* E-mail commentaire absent → traiter comme extérieur (V1). */
  return true;
}

/**
 * Plus récente réponse d’un autre via `Kanban_commentaires`
 * (horodatage fiable pour comparer à `lastSeen`).
 */
export function latestOtherReplyAt(
  ticket: KanbanTicket,
  comments: readonly KanbanCommentaireItem[],
): number {
  let latest = 0;
  for (const c of commentsForTicket(comments, ticket.id)) {
    if (isCommentFromOther(ticket, c) && c.dateSort > latest) {
      latest = c.dateSort;
    }
  }
  return latest;
}

/** Signal réponse : commentaires d’autrui **ou** champ `Reponse` non vide. */
export function hasOtherReplySignal(
  ticket: KanbanTicket,
  comments: readonly KanbanCommentaireItem[],
): boolean {
  if (ticket.reponse.trim() !== "") return true;
  return latestOtherReplyAt(ticket, comments) > 0;
}

export function computeVosRetourNovelty(
  ticket: KanbanTicket,
  comments: readonly KanbanCommentaireItem[],
  lastSeen: VosRetoursLastSeenMap,
): VosRetourNovelty {
  const entry = lastSeen[String(ticket.id)];
  const replyAt = latestOtherReplyAt(ticket, comments);

  if (!entry) {
    /* Première vue : réponse (commentaire / Reponse) ou ticket déjà déplacé. */
    if (hasOtherReplySignal(ticket, comments)) return "nouvelle_reponse";
    if (ticket.column !== "feedback") return "mis_a_jour";
    return null;
  }

  /* Après lecture : seuls les commentaires datés > seenAt (pas de Lu_le Grist). */
  if (replyAt > entry.seenAt) {
    return "nouvelle_reponse";
  }
  if (ticket.column !== entry.column) {
    return "mis_a_jour";
  }
  return null;
}

export function noveltyLabelFr(novelty: VosRetourNovelty): string | null {
  if (novelty === "nouvelle_reponse") return "Nouvelle réponse";
  if (novelty === "mis_a_jour") return "Mis à jour";
  return null;
}

export function columnLabelForRetour(column: KanbanColumnId): string {
  return KANBAN_COLUMN_LABEL[column] ?? column;
}

/** Activité récente : max(date ticket, dernières réponses d’autrui). */
export function activityAtForRetour(
  ticket: KanbanTicket,
  comments: readonly KanbanCommentaireItem[],
): number {
  return Math.max(ticket.dateSort, latestOtherReplyAt(ticket, comments), ticket.id);
}

export type BuildVosRetoursOptions = {
  tickets: readonly KanbanTicket[];
  comments: readonly KanbanCommentaireItem[];
  sessionEmail: string | null | undefined;
  lastSeen: VosRetoursLastSeenMap;
  now?: Date;
  limit?: number;
};

/** Liste compacte (défaut 5), tri activité récente décroissante. */
export function buildVosRetoursItems(options: BuildVosRetoursOptions): VosRetourItem[] {
  const {
    tickets,
    comments,
    sessionEmail,
    lastSeen,
    now = new Date(),
    limit = VOS_RETOURS_LIST_LIMIT,
  } = options;
  const mine = filterMesRetoursFeedback(tickets, sessionEmail);
  const items: VosRetourItem[] = mine.map((ticket) => {
    const novelty = computeVosRetourNovelty(ticket, comments, lastSeen);
    const activityAt = activityAtForRetour(ticket, comments);
    const relativeDate =
      ticket.dateSort > 0
        ? formatRelativeDateFr(new Date(ticket.dateSort), now)
        : ticket.dateLabel;
    return {
      ticket,
      novelty,
      noveltyLabel: noveltyLabelFr(novelty),
      columnLabel: columnLabelForRetour(ticket.column),
      relativeDate,
      activityAt,
    };
  });
  items.sort((a, b) => b.activityAt - a.activityAt || b.ticket.id - a.ticket.id);
  return items.slice(0, Math.max(0, limit));
}

/** Masquer le bloc si pas d’e-mail session fiable. */
export function shouldShowVosRetoursBlock(
  sessionEmail: string | null | undefined,
  profilKind: "freelance" | "responsable" | "admin" | "invite" | "unknown",
): boolean {
  if (profilKind === "unknown") return false;
  return normalizeEmail(sessionEmail) != null;
}
