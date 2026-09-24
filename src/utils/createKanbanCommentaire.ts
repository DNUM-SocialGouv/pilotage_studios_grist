/**
 * Création d’une ligne `Kanban_commentaires` via plugin API (`getTable().create`).
 * Cible = id ligne `Kanban` (Cible_type figé à « Kanban » pour compat colonne existante).
 */

import {
  KANBAN_COMMENTAIRES_TABLE_ID,
  assertWritableTableId,
} from "../security/writeTableAllowlist.ts";

export type CreateKanbanCommentaireInput = {
  cibleId: number;
  userName: string;
  userEmail: string;
  message: string;
  now?: Date;
};

export type KanbanCommentaireFields = {
  Cible_type: "Kanban";
  Cible_id: number;
  Date: string;
  Auteur: string;
  Email: string;
  Message: string;
};

/** Construit le payload champs (pur — testable hors Grist). */
export function buildKanbanCommentaireFields(
  input: CreateKanbanCommentaireInput,
): KanbanCommentaireFields {
  const message = input.message.trim();
  if (!message) {
    throw new Error("Message obligatoire");
  }
  const userName = input.userName.trim();
  if (!userName) {
    throw new Error("Auteur obligatoire");
  }
  if (!Number.isFinite(input.cibleId) || input.cibleId <= 0) {
    throw new Error("Ticket invalide");
  }

  return {
    Cible_type: "Kanban",
    Cible_id: input.cibleId,
    Date: (input.now ?? new Date()).toISOString(),
    Auteur: userName,
    Email: input.userEmail.trim(),
    Message: message,
  };
}

/**
 * Écrit une ligne dans `Kanban_commentaires`.
 * @returns id de la ligne créée
 */
export async function createKanbanCommentaire(
  input: CreateKanbanCommentaireInput,
): Promise<number> {
  assertWritableTableId(KANBAN_COMMENTAIRES_TABLE_ID);

  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }

  const fields = buildKanbanCommentaireFields(input);
  const result = await grist.getTable(KANBAN_COMMENTAIRES_TABLE_ID).create({ fields });
  const first = Array.isArray(result) ? result[0] : result;
  const id = first && typeof first === "object" && "id" in first ? Number(first.id) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Création Kanban_commentaires : réponse sans id valide.");
  }
  return id;
}
