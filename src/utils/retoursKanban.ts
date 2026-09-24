/**
 * Lecture des retours utilisateurs (table Grist `Retours`) pour l’accueil.
 * La colonne Feedback n’affiche que les retours encore ouverts (hors Fait / Écarté).
 */

export type RetourKanbanItem = {
  id: number;
  dateLabel: string;
  auteur: string;
  type: string;
  page: string;
  message: string;
  statut: string;
  niveauGene: string;
  lienTicket: string;
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

/** Grist DATETIME : secondes Unix (éventuellement fractionnaires) ou ISO. */
export function formatRetourDate(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }
  let date: Date | null = null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    date = new Date(ms);
  } else if (typeof value === "string" && value.trim() !== "") {
    const asNum = Number(value);
    if (Number.isFinite(asNum) && value.trim() !== "") {
      const ms = asNum > 1e12 ? asNum : asNum * 1000;
      date = new Date(ms);
    } else {
      date = new Date(value);
    }
  }
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function retourKanbanItemFromRecord(
  record: Record<string, unknown> & { id: number },
): RetourKanbanItem {
  return {
    id: record.id,
    dateLabel: formatRetourDate(record.Date),
    auteur: asString(record.Auteur) || "Anonyme",
    type: asString(record.Type) || "Retour",
    page: asString(record.Page),
    message: asString(record.Message),
    statut: asString(record.Statut),
    niveauGene: asString(record.Niveau_gene),
    lienTicket: asString(record.Lien_ticket),
  };
}

export function sortRetoursNewestFirst(items: RetourKanbanItem[]): RetourKanbanItem[] {
  return [...items].sort((a, b) => b.id - a.id);
}

/** Retours encore à traiter dans la colonne Feedback (hors soldés). */
export function isRetourOpenForFeedback(statut: string): boolean {
  const s = statut.trim().toLowerCase();
  if (!s) {
    return true;
  }
  return s !== "fait" && s !== "écarté" && s !== "ecarte" && s !== "terminé" && s !== "termine";
}

export function filterRetoursOpenForFeedback(
  items: readonly RetourKanbanItem[],
): RetourKanbanItem[] {
  return items.filter((item) => isRetourOpenForFeedback(item.statut));
}

/**
 * Affiche uniquement le prénom.
 * - « Alice Mathieu » → Alice
 * - « TOUMSY Olivier » (NOM Prénom) → Olivier
 */
export function prenomFromAuteur(auteur: string): string {
  const parts = auteur.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "Anonyme";
  }
  if (parts.length === 1) {
    return parts[0]!;
  }
  const first = parts[0]!;
  const looksLikeNomFirst =
    first === first.toLocaleUpperCase("fr-FR") && /[A-Za-zÀ-ÿ]/.test(first);
  if (looksLikeNomFirst) {
    return parts[parts.length - 1]!;
  }
  return first;
}

export function badgeClassForRetourType(type: string): string {
  const t = type.trim().toLowerCase();
  if (t === "anomalie") {
    return "fr-badge--error";
  }
  if (t === "suggestion") {
    return "fr-badge--info";
  }
  if (t === "question") {
    return "fr-badge--new";
  }
  return "";
}
