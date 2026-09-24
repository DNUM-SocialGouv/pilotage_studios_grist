/**
 * Mise à jour de la colonne kanban (`Colonne_kanban`) — Admin UX.
 * ACL Grist reste la vraie barrière (HITL).
 */

import {
  KANBAN_TABLE_ID,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import {
  statutProduitForColumn,
  type KanbanColumnId,
} from "./kanbanTickets.ts";

export type UpdateKanbanColonneFields = {
  Colonne_kanban: KanbanColumnId;
  Statut_produit: string;
  /** Feedback déplacé en Livré → Statut Fait. */
  Statut?: string;
};

export function buildKanbanColonnePatch(
  column: KanbanColumnId,
  nature: "Feedback" | "Produit",
): UpdateKanbanColonneFields {
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

export async function updateKanbanColonne(
  id: number,
  column: KanbanColumnId,
  nature: "Feedback" | "Produit",
): Promise<void> {
  assertWritableUpdateTableId(KANBAN_TABLE_ID);
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
