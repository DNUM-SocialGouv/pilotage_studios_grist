/**
 * Allowlist des tableIds autorisés pour une écriture widget (`getTable().create`).
 * Ne jamais accepter un id libre depuis l’UI — passer uniquement par `assertWritableTableId`.
 *
 * V1 : create uniquement sur `Retours` (pas d’update / delete, pas d’écriture métier).
 */

export const RETOURS_TABLE_ID = "Retours";

export const WRITE_TABLE_ALLOWLIST = [RETOURS_TABLE_ID] as const;

export type WritableTableId = (typeof WRITE_TABLE_ALLOWLIST)[number];

export function isWritableTableId(tableId: string): tableId is WritableTableId {
  return (WRITE_TABLE_ALLOWLIST as readonly string[]).includes(tableId);
}

export function assertWritableTableId(tableId: string): asserts tableId is WritableTableId {
  if (!isWritableTableId(tableId)) {
    throw new Error(`Table Grist non autorisée pour écriture widget : ${tableId}`);
  }
}
