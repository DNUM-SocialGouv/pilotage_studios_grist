/**
 * Tickets kanban unifiés (table Grist `Kanban`) — Feedback + Produit.
 */

export type KanbanNature = "Feedback" | "Produit";

export type KanbanColumnId = "feedback" | "backlog" | "en_cours" | "livre";

export type KanbanStatutProduit = "done" | "current" | "next" | "later";

export type KanbanColumn = {
  id: KanbanColumnId;
  label: string;
};

/** Colonnes produit (hors Feedback, affiché à part). */
export const KANBAN_PRODUCT_COLUMNS: KanbanColumn[] = [
  { id: "backlog", label: "Backlog" },
  { id: "en_cours", label: "En cours" },
  { id: "livre", label: "Livré" },
];

export const KANBAN_ALL_COLUMNS: KanbanColumn[] = [
  { id: "feedback", label: "Feedback" },
  ...KANBAN_PRODUCT_COLUMNS,
];

export const KANBAN_STATUS_LABEL: Record<KanbanStatutProduit, string> = {
  done: "Fait",
  current: "En cours",
  next: "À venir",
  later: "Plus tard",
};

export const KANBAN_STATUS_BADGE_CLASS: Record<KanbanStatutProduit, string> = {
  done: "fr-badge--success",
  current: "fr-badge--new",
  next: "fr-badge--info",
  later: "",
};

export const KANBAN_COLUMN_LABEL: Record<KanbanColumnId, string> = {
  feedback: "Feedback",
  backlog: "Backlog",
  en_cours: "En cours",
  livre: "Livré",
};

export type KanbanTicket = {
  id: number;
  nature: KanbanNature;
  column: KanbanColumnId;
  title: string;
  resume: string;
  theme: string;
  status: KanbanStatutProduit;
  guideLead: string;
  guideIntro: string;
  guideSteps: string[];
  pagePath: string;
  pageLinkLabel: string;
  lienGithub: string;
  cle: string;
  ordre: number;
  /** Feedback */
  dateLabel: string;
  /** Epoch ms (tri / dates relatives) — 0 si absente. */
  dateSort: number;
  auteur: string;
  /** E-mail auteur Feedback (filtre « mes retours »). */
  email: string;
  type: string;
  page: string;
  message: string;
  niveauGene: string;
  statutFeedback: string;
  /** Réponse métier Grist (signal « Nouvelle réponse » si non vide). */
  reponse: string;
};

export type KanbanProductGroup = {
  column: KanbanColumn;
  items: KanbanTicket[];
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

export function parseKanbanNature(value: unknown): KanbanNature {
  const s = asString(value);
  return s === "Feedback" ? "Feedback" : "Produit";
}

export function isKanbanColumnId(value: unknown): value is KanbanColumnId {
  return (
    value === "feedback" ||
    value === "backlog" ||
    value === "en_cours" ||
    value === "livre"
  );
}

export function parseKanbanColumn(value: unknown): KanbanColumnId {
  const s = asString(value).toLowerCase();
  if (s === "feedback") return "feedback";
  if (s === "en_cours" || s === "en-cours") return "en_cours";
  if (s === "livre" || s === "livré") return "livre";
  return "backlog";
}

/** Refuse toute valeur hors enum (écriture Admin). */
export function assertKanbanColumnId(value: unknown): asserts value is KanbanColumnId {
  if (!isKanbanColumnId(value)) {
    throw new Error("Colonne kanban invalide");
  }
}

export function parseKanbanStatutProduit(value: unknown): KanbanStatutProduit {
  const s = asString(value).toLowerCase();
  if (s === "done" || s === "fait") return "done";
  if (s === "current" || s === "en cours" || s === "en_cours") return "current";
  if (s === "next" || s === "à venir" || s === "a venir") return "next";
  return "later";
}

export function parseGuideSteps(value: unknown): string[] {
  const raw = asString(value);
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Timestamp ms pour tri (Grist DATETIME = secondes Unix ou ISO). */
export function kanbanDateSortKey(value: unknown): number {
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

/** Grist DATETIME : secondes Unix ou ISO. */
export function formatKanbanDate(value: unknown): string {
  const ms = kanbanDateSortKey(value);
  if (ms <= 0) return "";
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function kanbanTicketFromRecord(
  record: Record<string, unknown> & { id: number },
): KanbanTicket {
  const nature = parseKanbanNature(record.Nature);
  const type = asString(record.Type);
  const titre = asString(record.Titre);
  return {
    id: record.id,
    nature,
    column: parseKanbanColumn(record.Colonne_kanban),
    title: titre || type || (nature === "Feedback" ? "Retour" : "Sans titre"),
    resume: asString(record.Resume),
    theme: asString(record.Theme),
    status: parseKanbanStatutProduit(record.Statut_produit),
    guideLead: asString(record.Guide_lead),
    guideIntro: asString(record.Guide_intro),
    guideSteps: parseGuideSteps(record.Guide_etapes),
    pagePath: asString(record.Page_path),
    pageLinkLabel: asString(record.Page_lien_libelle),
    lienGithub: asString(record.Lien_github),
    cle: asString(record.Cle),
    ordre: asNumber(record.Ordre),
    dateLabel: formatKanbanDate(record.Date),
    dateSort: kanbanDateSortKey(record.Date),
    auteur: asString(record.Auteur) || "Anonyme",
    email: asString(record.Email),
    type: type || "Retour",
    page: asString(record.Page),
    message: asString(record.Message),
    niveauGene: asString(record.Niveau_gene),
    statutFeedback: asString(record.Statut),
    reponse: asString(record.Reponse),
  };
}

export function filterFeedbackColumn(items: readonly KanbanTicket[]): KanbanTicket[] {
  return items
    .filter((t) => t.nature === "Feedback" && t.column === "feedback")
    .sort((a, b) => b.id - a.id);
}

export function groupProductByKanban(items: readonly KanbanTicket[]): KanbanProductGroup[] {
  return KANBAN_PRODUCT_COLUMNS.map((column) => {
    const columnItems = items
      .filter((item) => item.column === column.id)
      .sort((a, b) => {
        if (a.ordre !== b.ordre) return a.ordre - b.ordre;
        return a.id - b.id;
      });
    return {
      column,
      items: column.id === "livre" ? [...columnItems].reverse() : columnItems,
    };
  });
}

/** Sync badge produit quand un Admin change de colonne. */
export function statutProduitForColumn(column: KanbanColumnId): KanbanStatutProduit {
  if (column === "livre") return "done";
  if (column === "en_cours") return "current";
  if (column === "feedback") return "current";
  return "later";
}

export function badgeClassForFeedbackType(type: string): string {
  const t = type.trim().toLowerCase();
  if (t === "anomalie") return "fr-badge--error";
  if (t === "suggestion") return "fr-badge--info";
  if (t === "question") return "fr-badge--new";
  return "";
}

/**
 * Affiche uniquement le prénom.
 * - « Alice Mathieu » → Alice
 * - « TOUMSY Olivier » (NOM Prénom) → Olivier
 */
export function prenomFromAuteur(auteur: string): string {
  const parts = auteur.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Anonyme";
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const looksLikeNomFirst =
    first === first.toLocaleUpperCase("fr-FR") && /[A-Za-zÀ-ÿ]/.test(first);
  if (looksLikeNomFirst) return parts[parts.length - 1]!;
  return first;
}
