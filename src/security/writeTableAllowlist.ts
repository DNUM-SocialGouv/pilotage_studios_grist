/**
 * Allowlist des tableIds autorisés pour une écriture widget (`getTable().create` / destroy).
 * Ne jamais accepter un id libre depuis l’UI — passer uniquement par `assertWritableTableId`.
 *
 * V1 :
 * - `Retours` : create du feedback
 * - `Feedback_Identite` : sonde create/destroy pour lire user.Name / user.Email (triggers)
 */

export const RETOURS_TABLE_ID = "Retours";
export const FEEDBACK_IDENTITE_TABLE_ID = "Feedback_Identite";

export const WRITE_TABLE_ALLOWLIST = [
  RETOURS_TABLE_ID,
  FEEDBACK_IDENTITE_TABLE_ID,
] as const;

export type WritableTableId = (typeof WRITE_TABLE_ALLOWLIST)[number];

export function isWritableTableId(tableId: string): tableId is WritableTableId {
  return (WRITE_TABLE_ALLOWLIST as readonly string[]).includes(tableId);
}

export function assertWritableTableId(tableId: string): asserts tableId is WritableTableId {
  if (!isWritableTableId(tableId)) {
    throw new Error(`Table Grist non autorisée pour écriture widget : ${tableId}`);
  }
}
