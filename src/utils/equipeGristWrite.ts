/**
 * Create fiche Équipe via plugin API (`getTable().create`).
 * Canal Grist interne uniquement — voir writeTableAllowlist.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import {
  EQUIPE_TABLE_ID,
  assertWritableTableId,
} from "../security/writeTableAllowlist.ts";
import type { EquipeCreateFields } from "./equipeFormFields.ts";

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
