import type { GristFetchTableResult } from "../gristTypes";

/**
 * Allowlist des tableIds passés à `docApi.fetchTable`.
 * Ne jamais accepter un id libre depuis l’UI — passer uniquement par `fetchAllowlistedTable`.
 */
export const PA_TABLE_ID = "Plan_activite";

/** Tables liées chargées au boot widget (PA / liste BDC / cascade finance). */
export const RELATED_TABLE_IDS = ["BDC", "Constatations", "Commandes_Sofiane"] as const;

export type RelatedTableId = (typeof RELATED_TABLE_IDS)[number];

/**
 * Tables lazy (pas au boot) : onglet Dépenses fiche BDC, écrans `/missions`,
 * et select auteur du widget feedback.
 * Lecture seule ; jeton REST `readOnly: true` quand la table passe par REST.
 */
export const BDC_DEPENSES_TABLE_IDS = [
  "Realise",
  "Missions",
  "Missions_enfants",
  "Equipe",
  "Tableau_de_pilotage_SDPC_Produits_SDPC",
] as const;

export const FETCH_TABLE_ALLOWLIST = [
  PA_TABLE_ID,
  ...RELATED_TABLE_IDS,
  ...BDC_DEPENSES_TABLE_IDS,
] as const;

export type AllowlistedTableId = (typeof FETCH_TABLE_ALLOWLIST)[number];

export function isAllowlistedTableId(tableId: string): tableId is AllowlistedTableId {
  return (FETCH_TABLE_ALLOWLIST as readonly string[]).includes(tableId);
}

/**
 * `fetchTable` avec garde runtime : refuse tout id hors allowlist.
 */
export async function fetchAllowlistedTable(
  tableId: AllowlistedTableId,
): Promise<GristFetchTableResult> {
  if (!isAllowlistedTableId(tableId)) {
    throw new Error(`Table Grist non autorisée pour fetchTable : ${tableId}`);
  }
  const grist = window.grist;
  if (!grist?.docApi?.fetchTable) {
    throw new Error("docApi.fetchTable indisponible");
  }
  return grist.docApi.fetchTable(tableId);
}
