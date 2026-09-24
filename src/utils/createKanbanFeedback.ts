/**
 * Création d’une ligne feedback dans `Kanban` via plugin API (`getTable().create`).
 * Champs alignés sur la carte kanban : Titre · Type · Resume · (Message détail) · Theme←Page.
 */

import {
  KANBAN_TABLE_ID,
  assertWritableTableId,
} from "../security/writeTableAllowlist.ts";

export type FeedbackType = "Anomalie" | "Suggestion" | "Question";

export type CreateKanbanFeedbackInput = {
  userName: string;
  userEmail: string;
  type: FeedbackType;
  /** Titre carte (court). */
  titre: string;
  /** Phrase valeur / why — corps de carte + drawer. */
  resume: string;
  /** Détail optionnel (drawer) ; si vide = même contenu que Resume. */
  message?: string;
  page: string;
  niveau: string;
  joinContext: boolean;
  href?: string;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  now?: Date;
};

export type KanbanFeedbackFields = {
  Nature: "Feedback";
  Colonne_kanban: "feedback";
  Titre: string;
  Resume: string;
  Theme: string;
  Date: string;
  Auteur: string;
  Email: string;
  Type: FeedbackType;
  Page: string;
  Message: string;
  Niveau_gene: string;
  Contexte_technique: string;
  Statut: "Nouveau";
};

const TITRE_MAX = 80;
const RESUME_MAX = 200;

export function clampTitre(titre: string): string {
  const t = titre.trim().replace(/\s+/g, " ");
  if (t.length <= TITRE_MAX) return t;
  return `${t.slice(0, TITRE_MAX - 1).trimEnd()}…`;
}

export function clampResume(resume: string): string {
  const t = resume.trim().replace(/\s+/g, " ");
  if (t.length <= RESUME_MAX) return t;
  return `${t.slice(0, RESUME_MAX - 1).trimEnd()}…`;
}

/** Construit le payload champs (pur — testable hors Grist). */
export function buildKanbanFeedbackFields(
  input: CreateKanbanFeedbackInput,
): KanbanFeedbackFields {
  const titre = clampTitre(input.titre);
  if (!titre) {
    throw new Error("Titre obligatoire");
  }
  const resume = clampResume(input.resume);
  if (!resume) {
    throw new Error("Résumé obligatoire");
  }
  const userName = input.userName.trim();
  if (!userName) {
    throw new Error("Auteur obligatoire");
  }

  const detail = (input.message ?? "").trim();
  const message = detail || resume;

  const href = input.href ?? "";
  const userAgent = input.userAgent ?? "";
  const w = input.screenWidth ?? 0;
  const h = input.screenHeight ?? 0;
  const contexte = input.joinContext
    ? `${href} · ${userAgent} · ${w}x${h}`
    : "";

  const page = input.page.trim();

  return {
    Nature: "Feedback",
    Colonne_kanban: "feedback",
    Titre: titre,
    Resume: resume,
    Theme: page,
    Date: (input.now ?? new Date()).toISOString(),
    Auteur: userName,
    Email: input.userEmail.trim(),
    Type: input.type,
    Page: page,
    Message: message,
    Niveau_gene: input.type === "Anomalie" ? input.niveau : "",
    Contexte_technique: contexte,
    Statut: "Nouveau",
  };
}

/**
 * Écrit une ligne Feedback dans `Kanban`. Refuse toute autre table.
 * @returns id de la ligne créée
 */
export async function createKanbanFeedbackRecord(
  input: CreateKanbanFeedbackInput,
): Promise<number> {
  assertWritableTableId(KANBAN_TABLE_ID);

  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }

  const fields = buildKanbanFeedbackFields(input);
  const result = await grist.getTable(KANBAN_TABLE_ID).create({ fields });
  const first = Array.isArray(result) ? result[0] : result;
  const id = first && typeof first === "object" && "id" in first ? Number(first.id) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Création Kanban : réponse sans id valide.");
  }
  return id;
}

/** @deprecated Alias — préférer `createKanbanFeedbackRecord`. */
export const createRetoursRecord = createKanbanFeedbackRecord;
/** @deprecated Alias — préférer `buildKanbanFeedbackFields`. */
export const buildRetoursFields = buildKanbanFeedbackFields;
