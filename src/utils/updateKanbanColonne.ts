/**
 * Mise à jour de la colonne kanban (`Colonne_kanban`) — Admin UX.
 * ACL Grist reste la vraie barrière (HITL).
 */

import {
  KANBAN_TABLE_ID,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import {
  assertKanbanColumnId,
  statutProduitForColumn,
  type KanbanColumnId,
  type KanbanNature,
} from "./kanbanTickets.ts";

export type UpdateKanbanColonneFields = {
  Colonne_kanban: KanbanColumnId;
  Statut_produit: string;
  /** Feedback déplacé en Livré → Statut Fait. */
  Statut?: string;
};

export function buildKanbanColonnePatch(
  column: KanbanColumnId,
  nature: KanbanNature,
): UpdateKanbanColonneFields {
  assertKanbanColumnId(column);
  const fields: UpdateKanbanColonneFields = {
    Colonne_kanban: column,
    Statut_produit: statutProduitForColumn(column),
  };
  if (nature === "Feedback") {
    if (column === "livre") {
      fields.Statut = "Fait";
    } else if (column === "feedback") {
      fields.Statut = "Nouveau";
    }
  }
  return fields;
}

export type UpdateKanbanColonneOptions = {
  /** Couche 5 : refus si non Admin (standalone dev = autorisé côté appelant). */
  isAdmin: boolean;
};

export async function updateKanbanColonne(
  id: number,
  column: KanbanColumnId,
  nature: KanbanNature,
  options: UpdateKanbanColonneOptions,
): Promise<void> {
  assertWritableUpdateTableId(KANBAN_TABLE_ID);
  if (!options.isAdmin) {
    throw new Error("Changement de colonne réservé aux Admin.");
  }
  assertKanbanColumnId(column);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant ticket invalide.");
  }
  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }
  const fields = buildKanbanColonnePatch(column, nature);
  await grist.getTable(KANBAN_TABLE_ID).update({ id, fields });
}
