/**
 * Create / update / delete `Portage_Projet` via plugin API (`getTable`).
 * Canal Grist interne uniquement — voir writeTableAllowlist.
 * Suppression : une ligne, après confirmation UI, jamais si une prestation est liée.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import {
  PORTAGE_PROJET_TABLE_ID,
  assertWritableDeleteTableId,
  assertWritableTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import {
  assertPortageProjetDeletable,
  type PortageProjetWriteFields,
} from "./portageProjetFormFields.ts";

function parseCreateId(result: GristTableCreateResult): number {
  const first = Array.isArray(result) ? result[0] : result;
  const id = first && typeof first === "object" && "id" in first ? Number(first.id) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Création Grist : réponse sans id valide.");
  }
  return id;
}

function getWritableTable(tableId: string) {
  const grist = window.grist;
  if (!grist?.getTable) {
    throw new Error("Écriture Grist indisponible (hors iframe ou API trop ancienne).");
  }
  return grist.getTable(tableId);
}

export async function createPortageProjetRecord(
  fields: PortageProjetWriteFields,
): Promise<number> {
  assertWritableTableId(PORTAGE_PROJET_TABLE_ID);
  if (!fields.Nom_du_projet?.trim()) {
    throw new Error("Le nom du projet est obligatoire.");
  }
  const result = await getWritableTable(PORTAGE_PROJET_TABLE_ID).create({ fields });
  return parseCreateId(result);
}

export async function updatePortageProjetRecord(
  id: number,
  fields: PortageProjetWriteFields,
): Promise<void> {
  assertWritableUpdateTableId(PORTAGE_PROJET_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant de portage invalide.");
  }
  if (Object.keys(fields).length === 0) {
    return;
  }
  await getWritableTable(PORTAGE_PROJET_TABLE_ID).update({ id, fields });
}

/**
 * Supprime un projet de portage (`Portage_Projet.destroy`).
 * `linkedPrestationCount` vient du décompte widget : > 0 refuse l’appel.
 */
export async function deletePortageProjetRecord(
  id: number,
  linkedPrestationCount: number,
): Promise<void> {
  assertWritableDeleteTableId(PORTAGE_PROJET_TABLE_ID);
  assertPortageProjetDeletable(linkedPrestationCount);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant de portage invalide.");
  }
  const table = getWritableTable(PORTAGE_PROJET_TABLE_ID);
  if (typeof table.destroy !== "function") {
    throw new Error("Suppression Grist indisponible (hors iframe ou API trop ancienne).");
  }
  await table.destroy([id]);
}
