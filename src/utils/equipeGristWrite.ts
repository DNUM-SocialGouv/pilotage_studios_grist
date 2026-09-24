/**
 * Create / update fiche Équipe via plugin API (`getTable().create|update`).
 * Canal Grist interne uniquement — voir writeTableAllowlist.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import {
  EQUIPE_TABLE_ID,
  assertWritableTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import type { EquipeCreateFields, EquipeUpdateFields } from "./equipeFormFields.ts";

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

export async function createEquipeRecord(fields: EquipeCreateFields): Promise<number> {
  assertWritableTableId(EQUIPE_TABLE_ID);
  const result = await getWritableTable(EQUIPE_TABLE_ID).create({ fields });
  return parseCreateId(result);
}

export async function updateEquipeRecord(
  id: number,
  fields: EquipeUpdateFields,
): Promise<void> {
  assertWritableUpdateTableId(EQUIPE_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant fiche Équipe invalide.");
  }
  await getWritableTable(EQUIPE_TABLE_ID).update({ id, fields });
}
