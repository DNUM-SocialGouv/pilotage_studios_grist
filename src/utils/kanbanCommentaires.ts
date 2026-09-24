/**
 * Lecture / parsing des commentaires kanban (table `Kanban_commentaires`).
 * Filtre par `Cible_id` (= id ligne `Kanban`).
 */

import { formatKanbanDate } from "./kanbanTickets.ts";

export type KanbanCommentaireItem = {
  id: number;
  cibleId: number;
  dateLabel: string;
  dateSort: number;
  auteur: string;
  message: string;
};

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Timestamp ms pour tri (Grist DATETIME = secondes Unix ou ISO). */
export function commentaireDateSortKey(value: unknown): number {
  if (value == null || value === "") {
    return 0;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const asNum = Number(value);
    if (Number.isFinite(asNum) && value.trim() !== "") {
      return asNum > 1e12 ? asNum : asNum * 1000;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function kanbanCommentaireFromRecord(
  record: Record<string, unknown> & { id: number },
): KanbanCommentaireItem | null {
  const cibleId = asNumber(record.Cible_id);
  if (cibleId <= 0) {
    return null;
  }
  return {
    id: record.id,
    cibleId,
    dateLabel: formatKanbanDate(record.Date),
    dateSort: commentaireDateSortKey(record.Date),
    auteur: asString(record.Auteur) || "Anonyme",
    message: asString(record.Message),
  };
}

export function filterCommentairesForTicket(
  items: readonly KanbanCommentaireItem[],
  cibleId: number,
): KanbanCommentaireItem[] {
  return items
    .filter((item) => item.cibleId === cibleId)
    .sort((a, b) => b.dateSort - a.dateSort || b.id - a.id);
}
