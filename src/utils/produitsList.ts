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
  /** Si true : uniquement produits avec jours CRA &gt; 0 ou TTC CRA &gt; 0. */
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
 * (via mission / prestation) avec jours &gt; 0 ou TTC &gt; 0.
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
  const joursByProduit = new Map<number, number>();
  const ttcByProduit = new Map<number, number>();

  for (const row of suivi) {
    const masterId = resolveSuiviMasterMissionId(row, enfantsById);
    if (masterId == null) {
      continue;
    }
    const produitId = produitByMissionId.get(masterId);
    if (produitId == null) {
      continue;
    }
    const jours =
      typeof row.Nb_jours === "number" && Number.isFinite(row.Nb_jours) ? row.Nb_jours : 0;
    const ttc = montantTtcLigneSuivi(row);
    joursByProduit.set(produitId, (joursByProduit.get(produitId) ?? 0) + jours);
    ttcByProduit.set(produitId, (ttcByProduit.get(produitId) ?? 0) + ttc);
  }

  const ids = new Set<number>();
  for (const [produitId, jours] of joursByProduit) {
    if (jours > 0 || (ttcByProduit.get(produitId) ?? 0) > 0) {
      ids.add(produitId);
    }
  }
  for (const [produitId, ttc] of ttcByProduit) {
    if (ttc > 0) {
      ids.add(produitId);
    }
  }
  return ids;
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
