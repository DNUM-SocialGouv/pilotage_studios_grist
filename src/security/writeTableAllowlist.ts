/**
 * Allowlist des tableIds autorisés pour une écriture widget (`getTable().create|update`).
 * Ne jamais accepter un id libre depuis l’UI — passer uniquement par les gardes dédiées.
 *
 * - `Retours` : create only (feedback).
 * - `Missions` : create + update (drawer mission master — pas de delete).
 * - `Missions_enfants` : create only (première prestation à la création mission).
 */

export const RETOURS_TABLE_ID = "Retours";
export const MISSIONS_TABLE_ID = "Missions";
export const MISSIONS_ENFANTS_TABLE_ID = "Missions_enfants";

export const WRITE_TABLE_ALLOWLIST = [
  RETOURS_TABLE_ID,
  MISSIONS_TABLE_ID,
  MISSIONS_ENFANTS_TABLE_ID,
] as const;

export type WritableTableId = (typeof WRITE_TABLE_ALLOWLIST)[number];

/** Tables autorisées pour `getTable().update` (sous-ensemble). */
export const WRITE_TABLE_UPDATE_ALLOWLIST = [MISSIONS_TABLE_ID] as const;

export type WritableUpdateTableId = (typeof WRITE_TABLE_UPDATE_ALLOWLIST)[number];

export function isWritableTableId(tableId: string): tableId is WritableTableId {
  return (WRITE_TABLE_ALLOWLIST as readonly string[]).includes(tableId);
}

export function isWritableUpdateTableId(tableId: string): tableId is WritableUpdateTableId {
  return (WRITE_TABLE_UPDATE_ALLOWLIST as readonly string[]).includes(tableId);
}

export function assertWritableTableId(tableId: string): asserts tableId is WritableTableId {
  if (!isWritableTableId(tableId)) {
    throw new Error(`Table Grist non autorisée pour écriture widget : ${tableId}`);
  }
}

export function assertWritableUpdateTableId(
  tableId: string,
): asserts tableId is WritableUpdateTableId {
  if (!isWritableUpdateTableId(tableId)) {
    throw new Error(`Table Grist non autorisée pour mise à jour widget : ${tableId}`);
  }
}
