/**
 * Lecture des tickets produit (table Grist `Roadmap`) pour le kanban d’accueil.
 */

export type RoadmapKanbanColumnId = "backlog" | "en_cours" | "livre";

export type RoadmapStatutProduit = "done" | "current" | "next" | "later";

export type RoadmapKanbanColumn = {
  id: RoadmapKanbanColumnId;
  label: string;
};

export const ROADMAP_KANBAN_COLUMNS: RoadmapKanbanColumn[] = [
  { id: "backlog", label: "Backlog" },
  { id: "en_cours", label: "En cours" },
  { id: "livre", label: "Livré" },
];

export const ROADMAP_STATUS_LABEL: Record<RoadmapStatutProduit, string> = {
  done: "Fait",
  current: "En cours",
  next: "À venir",
  later: "Plus tard",
};

/** Badge DSFR : success / new / info / neutre selon le statut. */
export const ROADMAP_STATUS_BADGE_CLASS: Record<RoadmapStatutProduit, string> = {
  done: "fr-badge--success",
  current: "fr-badge--new",
  next: "fr-badge--info",
  later: "",
};

export type RoadmapTicket = {
  id: number;
  cle: string;
  title: string;
  summary: string;
  theme: string;
  column: RoadmapKanbanColumnId;
  status: RoadmapStatutProduit;
  guideLead: string;
  guideIntro: string;
  guideSteps: string[];
  pagePath: string;
  pageLinkLabel: string;
  lienGithub: string;
  ordre: number;
};

export type RoadmapKanbanGroup = {
  column: RoadmapKanbanColumn;
  items: RoadmapTicket[];
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

export function parseRoadmapColumn(value: unknown): RoadmapKanbanColumnId {
  const s = asString(value).toLowerCase();
  if (s === "en_cours" || s === "en-cours") {
    return "en_cours";
  }
  if (s === "livre" || s === "livré") {
    return "livre";
  }
  return "backlog";
}

export function parseRoadmapStatutProduit(value: unknown): RoadmapStatutProduit {
  const s = asString(value).toLowerCase();
  if (s === "done" || s === "fait") {
    return "done";
  }
  if (s === "current" || s === "en cours" || s === "en_cours") {
    return "current";
  }
  if (s === "next" || s === "à venir" || s === "a venir") {
    return "next";
  }
  return "later";
}

export function parseGuideSteps(value: unknown): string[] {
  const raw = asString(value);
  if (!raw) {
    return [];
  }
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function roadmapTicketFromRecord(
  record: Record<string, unknown> & { id: number },
): RoadmapTicket {
  return {
    id: record.id,
    cle: asString(record.Cle),
    title: asString(record.Titre) || "Sans titre",
    summary: asString(record.Resume),
    theme: asString(record.Theme),
    column: parseRoadmapColumn(record.Colonne_kanban),
    status: parseRoadmapStatutProduit(record.Statut_produit),
    guideLead: asString(record.Guide_lead),
    guideIntro: asString(record.Guide_intro),
    guideSteps: parseGuideSteps(record.Guide_etapes),
    pagePath: asString(record.Page_path),
    pageLinkLabel: asString(record.Page_lien_libelle),
    lienGithub: asString(record.Lien_github),
    ordre: asNumber(record.Ordre),
  };
}

/** Regroupe les tickets en Backlog → En cours → Livré (Livré : ordre croissant = plus récent en bas du seed → reverse). */
export function groupRoadmapByKanban(items: RoadmapTicket[]): RoadmapKanbanGroup[] {
  return ROADMAP_KANBAN_COLUMNS.map((column) => {
    const columnItems = items
      .filter((item) => item.column === column.id)
      .sort((a, b) => {
        if (a.ordre !== b.ordre) {
          return a.ordre - b.ordre;
        }
        return a.id - b.id;
      });
    return {
      column,
      items: column.id === "livre" ? [...columnItems].reverse() : columnItems,
    };
  });
}
