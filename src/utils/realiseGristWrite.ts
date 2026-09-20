/**
 * Create / update lignes CRA (`Realise`) via plugin API.
 * Canal Grist interne uniquement — voir writeTableAllowlist.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import {
  REALISE_TABLE_ID,
  assertWritableTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";

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

export async function createRealiseRecord(
  fields: Record<string, unknown>,
): Promise<number> {
  assertWritableTableId(REALISE_TABLE_ID);
  const result = await getWritableTable(REALISE_TABLE_ID).create({ fields });
  return parseCreateId(result);
}

export async function updateRealiseRecord(
  id: number,
  fields: Record<string, unknown>,
): Promise<void> {
  assertWritableUpdateTableId(REALISE_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant CRA invalide.");
  }
  await getWritableTable(REALISE_TABLE_ID).update({ id, fields });
}
