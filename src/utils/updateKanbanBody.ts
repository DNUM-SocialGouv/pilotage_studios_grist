/**
 * Mise à jour du corps d’une carte kanban (`Resume` + `Message`) — Admin UX.
 * ACL Grist reste la vraie barrière (Owner / Role_ACL Admin).
 */

import {
  KANBAN_TABLE_ID,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";

export type UpdateKanbanBodyFields = {
  Resume: string;
  Message: string;
};

export type UpdateKanbanBodyInput = {
  /** Phrase valeur — libellé drawer « Résumé ». */
  resume: string;
  /** Détail drawer — libellé « Détail » (peut être vide). */
  message?: string;
};

export type UpdateKanbanBodyOptions = {
  /** Couche 5 : refus si non Admin (standalone dev = autorisé côté appelant). */
  isAdmin: boolean;
};

/** Construit le patch champs (pur — testable hors Grist). */
export function buildKanbanBodyPatch(input: UpdateKanbanBodyInput): UpdateKanbanBodyFields {
  const resume = input.resume.trim();
  if (!resume) {
    throw new Error("Résumé obligatoire");
  }
  const message = (input.message ?? "").trim();
  return {
    Resume: resume,
    Message: message,
  };
}

export async function updateKanbanBody(
  id: number,
  input: UpdateKanbanBodyInput,
  options: UpdateKanbanBodyOptions,
): Promise<UpdateKanbanBodyFields> {
  assertWritableUpdateTableId(KANBAN_TABLE_ID);
  if (!options.isAdmin) {
    throw new Error("Édition du contenu réservée aux Admin.");
  }
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant ticket invalide.");
  }
  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }
  const fields = buildKanbanBodyPatch(input);
  await grist.getTable(KANBAN_TABLE_ID).update({ id, fields });
  return fields;
}
