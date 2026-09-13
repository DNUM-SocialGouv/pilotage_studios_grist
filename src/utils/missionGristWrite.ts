/**
 * CRU missions via plugin API (`getTable().create|update`).
 * Canal Grist interne uniquement — voir writeTableAllowlist.
 */

import type { GristTableCreateResult } from "../gristTypes.ts";
import type { Mission } from "../types.ts";
import {
  MISSIONS_ENFANTS_TABLE_ID,
  MISSIONS_TABLE_ID,
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

export async function createMissionRecord(
  fields: Partial<Omit<Mission, "id">>,
): Promise<number> {
  assertWritableTableId(MISSIONS_TABLE_ID);
  const result = await getWritableTable(MISSIONS_TABLE_ID).create({ fields });
  return parseCreateId(result);
}

export async function updateMissionRecord(
  id: number,
  fields: Partial<Omit<Mission, "id">>,
): Promise<void> {
  assertWritableUpdateTableId(MISSIONS_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant mission invalide.");
  }
  await getWritableTable(MISSIONS_TABLE_ID).update({ id, fields });
}

export async function createMissionEnfantRecord(
  fields: Record<string, unknown>,
): Promise<number> {
  assertWritableTableId(MISSIONS_ENFANTS_TABLE_ID);
  const result = await getWritableTable(MISSIONS_ENFANTS_TABLE_ID).create({ fields });
  return parseCreateId(result);
}

export async function updateMissionEnfantRecord(
  id: number,
  fields: Record<string, unknown>,
): Promise<void> {
  assertWritableUpdateTableId(MISSIONS_ENFANTS_TABLE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Identifiant prestation invalide.");
  }
  await getWritableTable(MISSIONS_ENFANTS_TABLE_ID).update({ id, fields });
}
