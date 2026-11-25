import { PARC_UUID_TO_ROW_ID } from "../data/parcUuidToRowId.ts";
import type { Mission, MissionEnfant, ProduitSdpc, SuiviMensuel } from "../types.ts";
import { isPrestationEnCours } from "./equipeMemberPrestations.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import { resolveSuiviMasterMissionId } from "./missionEnfants.ts";
import { departementProduitSdpc, libelleProduitGrist } from "./pilotageProduits.ts";
import { uniqueSortedLabels } from "./equipeList.ts";
import { montantTtcLigneSuivi } from "./suiviMensuel.ts";

/** True si la mission a un statut actif (pas terminé / clos / archivé / annulé).
 * Statut vide → false (pas d’ouverture forcée ni priorité de tri sur la fiche produit).
 */
export function isMissionEnCours(statut: string | undefined): boolean {
  if (!statut?.trim()) {
    return false;
  }
  return isPrestationEnCours(statut);
}

/** Filtre investissement studio : activé par défaut (réduit le bruit du catalogue). */
export const PRODUITS_DEFAULT_AVEC_INVESTISSEMENT = true;

export type ProduitsListFilters = {
  search: string;
  departement: string;
  statut: string;
  /** Si true : uniquement produits avec jours CRA > 0 ou TTC CRA > 0. */
  avecInvestissementStudio: boolean;
};

export function produitDisplayName(produit: ProduitSdpc): string {
  return libelleProduitGrist(produit as unknown as Record<string, unknown>, produit.id);
}

export function produitDepartement(produit: ProduitSdpc): string {
  const d = departementProduitSdpc(produit as unknown as Record<string, unknown>);
  return d === "—" ? "" : d;
}

export function produitDescription(produit: ProduitSdpc): string {
  const short = produit.Description?.trim();
  if (short) {
    return short;
  }
  return produit.Description_longue?.trim() ?? "";
}

/** Libellé affichable En production (liste / badge). */
export function produitEnProdLabel(enProd: boolean | undefined): string {
  if (enProd === true) {
    return "Oui";
  }
  if (enProd === false) {
    return "Non";
  }
  return "—";
}

/**
 * Ids produits ayant un investissement studio : au moins un CRA rattaché
 * (via mission / prestation) avec jours > 0 ou TTC > 0.
 */
export function produitIdsAvecInvestissement(
  missions: readonly Mission[],
  missionEnfants: readonly MissionEnfant[],
  suivi: readonly SuiviMensuel[],
): Set<number> {
  const produitByMissionId = new Map<number, number>();
  for (const m of missions) {
    const produitId = extractGristReferenceId(m.Produit_SDPC);
    if (produitId != null && produitId !== 0) {
      produitByMissionId.set(m.id, produitId);
    }
  }

  const enfantsById = new Map(missionEnfants.map((e) => [e.id, e]));
  const ids = new Set<number>();

  for (const row of suivi) {
    const masterId = resolveSuiviMasterMissionId(row, enfantsById);
    if (masterId == null) {
      continue;
    }
    const produitId = produitByMissionId.get(masterId);
    if (produitId == null || ids.has(produitId)) {
      continue;
    }
    const jours =
      typeof row.Nb_jours === "number" && Number.isFinite(row.Nb_jours) ? row.Nb_jours : 0;
    const ttc = montantTtcLigneSuivi(row);
    if (jours > 0 || ttc > 0) {
      ids.add(produitId);
    }
  }
  return ids;
}

/**
 * True si on peut appliquer le filtre investissement sans vider le catalogue à tort
 * (ex. aucun CRA lisible — Access Rules ou tables manquantes).
 */
export function canApplyInvestissementFilter(
  produitIdsInvestis: ReadonlySet<number>,
): boolean {
  return produitIdsInvestis.size > 0;
}

export function produitDepartementOptions(produits: readonly ProduitSdpc[]): string[] {
  return uniqueSortedLabels(produits.map((p) => produitDepartement(p) || undefined));
}

export function produitStatutOptions(produits: readonly ProduitSdpc[]): string[] {
  return uniqueSortedLabels(produits.map((p) => p.Statut_actuel));
}

export function filterProduits(
  produits: readonly ProduitSdpc[],
  filters: ProduitsListFilters,
  produitIdsInvestis?: ReadonlySet<number>,
): ProduitSdpc[] {
  const q = filters.search.trim().toLowerCase();
  const investis = produitIdsInvestis ?? new Set<number>();
  return produits
    .filter((produit) => {
      const dept = produitDepartement(produit);
      const okDept = !filters.departement || dept === filters.departement;
      const okStatut =
        !filters.statut || (produit.Statut_actuel?.trim() ?? "") === filters.statut;
      const okInvest =
        !filters.avecInvestissementStudio || investis.has(produit.id);
      if (!okDept || !okStatut || !okInvest) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = [
        produitDisplayName(produit),
        dept,
        produit.Statut_actuel,
        produit.Chef_de_produit,
        produit.Equipe,
        produit.Type_de_produit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) =>
      produitDisplayName(a).localeCompare(produitDisplayName(b), "fr", {
        sensitivity: "base",
      }),
    );
}

function missionNomSortKey(mission: Mission): string {
  return mission.Nom_de_la_mission ?? `Mission #${mission.id}`;
}

/** Missions rattachées au produit (réf. `Produit_SDPC`).
 * Tri métier : en cours d’abord, puis terminées ; alpha dans chaque groupe.
 */
export function missionsLieesAuProduit(
  missions: readonly Mission[],
  produitId: number,
): Mission[] {
  return missions
    .filter((m) => extractGristReferenceId(m.Produit_SDPC) === produitId)
    .sort((a, b) => {
      const aActive = isMissionEnCours(a.Statut) ? 0 : 1;
      const bActive = isMissionEnCours(b.Statut) ? 0 : 1;
      if (aActive !== bActive) {
        return aActive - bActive;
      }
      return missionNomSortKey(a).localeCompare(missionNomSortKey(b), "fr", {
        sensitivity: "base",
      });
    });
}

/**
 * Document Le PARC (référentiel produits DNUM).
 * Lien profond : l’`id` de ligne **diffère** entre Pilotage et Le PARC ;
 * on résout via l’`UUID` sync → map `PARC_UUID_TO_ROW_ID` → hash `#a1.s34.r{id}.c138`.
 */
export const PARC_DOC_BASE_URL =
  "https://grist.numerique.gouv.fr/o/sdpc/vjbmAgqvttQH/Le-PARC-Portail-des-Applications-Referentiels-et-Communs-Numeriques-de-la-DNUM";

/** Page Grist « fiche produit » stable dans Le PARC (p/92 et p/139 ouvrent la même ligne). */
const PARC_FICHE_PAGE_PATH = "/p/92";

/** Section / colonne de la vue fiche (hash Grist) — figés tant que la page PARC n’est pas reconstruite. */
const PARC_FICHE_HASH_PREFIX = "#a1.s34.r";
const PARC_FICHE_HASH_SUFFIX = ".c138";

/** Id de ligne Le PARC pour un UUID sync ; `undefined` si inconnu / absent. */
export function parcRowIdFromUuid(uuid: string | undefined): number | undefined {
  const key = uuid?.trim();
  if (!key) {
    return undefined;
  }
  const rowId = PARC_UUID_TO_ROW_ID[key];
  return Number.isInteger(rowId) && rowId >= 1 ? rowId : undefined;
}

/**
 * URL précise vers la ligne produit dans Le PARC (via UUID sync).
 * Sans UUID connu dans la map → page fiche sans ligne (évite « ligne indisponible »).
 */
export function parcProduitFicheUrl(uuid: string | undefined): string {
  const page = `${PARC_DOC_BASE_URL}${PARC_FICHE_PAGE_PATH}`;
  const rowId = parcRowIdFromUuid(uuid);
  if (rowId == null) {
    return page;
  }
  return `${page}${PARC_FICHE_HASH_PREFIX}${rowId}${PARC_FICHE_HASH_SUFFIX}`;
}

/** Libellé du lien : précis seulement si la ligne PARC est résolue. */
export function parcProduitFicheLinkLabel(uuid: string | undefined): string {
  return parcRowIdFromUuid(uuid) != null
    ? "Le PARC — modifier la fiche"
    : "Ouvrir Le PARC";
}

/** URL http(s) sûre pour liens externes fiche ; sinon `undefined`.
 * Accepte une URL seule ou extrait la première `http(s)://…` d’un texte multi-valeurs.
 */
export function safeHttpUrl(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) {
    return undefined;
  }

  const tryParse = (candidate: string): string | undefined => {
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.href;
      }
    } catch {
      return undefined;
    }
    return undefined;
  };

  // Premier token http(s) (stop aux espaces / retours ligne) — évite de coller plusieurs URLs.
  const match = t.match(/https?:\/\/[^\s<>"']+/i);
  if (match?.[0]) {
    const token = match[0].replace(/[.,);]+$/u, "");
    const fromToken = tryParse(token);
    if (fromToken) {
      return fromToken;
    }
  }

  return tryParse(t);
}
