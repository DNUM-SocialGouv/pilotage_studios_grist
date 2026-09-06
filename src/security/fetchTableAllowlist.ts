/**
 * Allowlist des tableIds passés à `docApi.fetchTable`.
 * Ne jamais accepter un id libre depuis l’UI.
 */
export const PA_TABLE_ID = "Plan_activite";

export const RELATED_TABLE_IDS = ["BDC", "Constatations", "Commandes_Sofiane"] as const;

export type RelatedTableId = (typeof RELATED_TABLE_IDS)[number];

export const FETCH_TABLE_ALLOWLIST = [PA_TABLE_ID, ...RELATED_TABLE_IDS] as const;
