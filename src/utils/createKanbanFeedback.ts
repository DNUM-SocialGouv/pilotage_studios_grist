/**
 * Création d’une ligne feedback dans `Kanban` via plugin API (`getTable().create`).
 * Garde runtime : seule la table allowlistée écriture.
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
  page: string;
  message: string;
  niveau: string;
  joinContext: boolean;
  /** URL widget / contexte technique (si joinContext). */
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

/** Première ligne non vide du message (phrase valeur / why). */
export function resumeFromMessage(message: string): string {
  const first = message
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);
  if (!first) return "";
  return first.length > 200 ? `${first.slice(0, 197).trimEnd()}…` : first;
}

/** Construit le payload champs (pur — testable hors Grist). */
export function buildKanbanFeedbackFields(
  input: CreateKanbanFeedbackInput,
): KanbanFeedbackFields {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Message obligatoire");
  }
  const userName = input.userName.trim();
  if (!userName) {
    throw new Error("Auteur obligatoire");
  }

  const href = input.href ?? "";
  const userAgent = input.userAgent ?? "";
  const w = input.screenWidth ?? 0;
  const h = input.screenHeight ?? 0;
  const contexte = input.joinContext
    ? `${href} · ${userAgent} · ${w}x${h}`
    : "";

  return {
    Nature: "Feedback",
    Colonne_kanban: "feedback",
    Titre: input.type,
    Resume: resumeFromMessage(message),
    Date: (input.now ?? new Date()).toISOString(),
    Auteur: userName,
    Email: input.userEmail.trim(),
    Type: input.type,
    Page: input.page,
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
