import type { GristFetchTableResult } from "../gristTypes";
import {
  DROITS_PAGES_TABLE_ID,
  KANBAN_COMMENTAIRES_TABLE_ID,
  KANBAN_TABLE_ID,
  ACL_PROFIL_TABLE_ID,
} from "./writeTableAllowlist.ts";

/**
 * Allowlist des tableIds passés à `docApi.fetchTable`.
 * Ne jamais accepter un id libre depuis l’UI — passer uniquement par `fetchAllowlistedTable`.
 */
export const PA_TABLE_ID = "Plan_activite";

/** Tables liées chargées au boot widget (PA / liste BDC / cascade finance). */
export const RELATED_TABLE_IDS = ["BDC", "Constatations", "Commandes_Sofiane"] as const;

export type RelatedTableId = (typeof RELATED_TABLE_IDS)[number];

/**
 * Tables lazy (pas au boot PA) : onglet Dépenses fiche BDC, écrans `/missions`, `/cra`,
 * `/outils/recap-porteurs`, `/equipe`, `/produits`, select auteur du widget feedback.
 * Lecture seule ; jeton REST `readOnly: true` quand la table passe par REST.
 */
export const BDC_DEPENSES_TABLE_IDS = [
  "Realise",
  "Missions",
  "Missions_enfants",
  "Equipe",
  "Tableau_de_pilotage_SDPC_Produits_SDPC",
] as const;

/**
 * Pont droits pages (couche 4→5) : lu juste après le boot PA (nav / gardes).
 * Une ligne session via Access Rules ; formules `Page_*` ← `Droits_pages`.
 * Create auto widget si absente — voir `aclProfilGristWrite`.
 */
export { ACL_PROFIL_TABLE_ID };

/** Réexport pour les appelants lecture (page Admin). */
export { DROITS_PAGES_TABLE_ID };

/** Kanban accueil unifié (Feedback + produit). */
export { KANBAN_TABLE_ID };

/** `Kanban` + commentaires : lu après boot PA (pas au même tick que `Plan_activite`). */

export const FETCH_TABLE_ALLOWLIST = [
  PA_TABLE_ID,
  ...RELATED_TABLE_IDS,
  ...BDC_DEPENSES_TABLE_IDS,
  ACL_PROFIL_TABLE_ID,
  DROITS_PAGES_TABLE_ID,
  KANBAN_TABLE_ID,
  KANBAN_COMMENTAIRES_TABLE_ID,
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
