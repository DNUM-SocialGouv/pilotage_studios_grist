import type { Mission, ProduitSdpc } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import { departementProduitSdpc, libelleProduitGrist } from "./pilotageProduits.ts";
import { uniqueSortedLabels } from "./equipeList.ts";

/** Filtre « En production » : Oui par défaut (réduit le bruit du catalogue). */
export const PRODUITS_DEFAULT_EN_PROD = "oui";

export type ProduitsEnProdFilter = "" | "oui" | "non";

export type ProduitsListFilters = {
  search: string;
  departement: string;
  statut: string;
  enProd: ProduitsEnProdFilter;
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
 * Filtre En production initial : « Oui » si au moins un produit a En_prod === true,
 * sinon tous (évite une liste vide si la colonne est absente / censurée).
 */
export function initialProduitsEnProdFilter(
  produits: readonly ProduitSdpc[],
): ProduitsEnProdFilter {
  if (produits.some((p) => p.En_prod === true)) {
    return PRODUITS_DEFAULT_EN_PROD;
  }
  return "";
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
): ProduitSdpc[] {
  const q = filters.search.trim().toLowerCase();
  return produits
    .filter((produit) => {
      const dept = produitDepartement(produit);
      const okDept = !filters.departement || dept === filters.departement;
      const okStatut =
        !filters.statut || (produit.Statut_actuel?.trim() ?? "") === filters.statut;
      const okEnProd =
        !filters.enProd ||
        (filters.enProd === "oui" && produit.En_prod === true) ||
        (filters.enProd === "non" && produit.En_prod === false);
      if (!okDept || !okStatut || !okEnProd) {
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

/** Missions rattachées au produit (réf. `Produit_SDPC`). */
export function missionsLieesAuProduit(
  missions: readonly Mission[],
  produitId: number,
): Mission[] {
  return missions
    .filter((m) => extractGristReferenceId(m.Produit_SDPC) === produitId)
    .sort((a, b) =>
      (a.Nom_de_la_mission ?? `Mission #${a.id}`).localeCompare(
        b.Nom_de_la_mission ?? `Mission #${b.id}`,
        "fr",
        { sensitivity: "base" },
      ),
    );
}

/** URL http(s) sûre pour liens externes fiche ; sinon `undefined`. */
export function safeHttpUrl(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t) {
    return undefined;
  }
  try {
    const url = new URL(t);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
