/**
 * Dispatch des grilles BPU Lot 4 selon le porteur sélectionné.
 */

import {
  findUoTarifHubvisory,
  UO_TARIFS_HUBVISORY,
  UO_TARIFS_HUBVISORY_META,
} from "./uoTarifsHubvisory.ts";
import {
  findUoTarifIpponInops,
  UO_TARIFS_IPPON_INOPS,
  UO_TARIFS_IPPON_INOPS_META,
} from "./uoTarifsIpponInops.ts";
import {
  findUoTarifOctoMalt,
  UO_TARIFS_OCTO_MALT,
  UO_TARIFS_OCTO_MALT_META,
} from "./uoTarifsOctoMalt.ts";
import {
  computeChiffrageLignes,
  formatChiffrageQuantites,
  type UoQuantiteLigne,
  type UoTarifEntry,
  type UoTarifGrilleMeta,
} from "./uoTarifsShared.ts";
import type { DevisPorteurId } from "../utils/devisPorteurs/types.ts";

export type { UoTarifEntry, UoQuantiteLigne } from "./uoTarifsShared.ts";
export { formatEuro, computeChiffrageLignes } from "./uoTarifsShared.ts";

type PorteurGrille = {
  meta: UoTarifGrilleMeta;
  tarifs: readonly UoTarifEntry[];
  find: (code: string) => UoTarifEntry | undefined;
};

const GRILLES: Partial<Record<DevisPorteurId, PorteurGrille>> = {
  "hubvisory-numercite-opteamis": {
    meta: UO_TARIFS_HUBVISORY_META,
    tarifs: UO_TARIFS_HUBVISORY,
    find: findUoTarifHubvisory,
  },
  "octo-malt": {
    meta: UO_TARIFS_OCTO_MALT_META,
    tarifs: UO_TARIFS_OCTO_MALT,
    find: findUoTarifOctoMalt,
  },
  "ippon-inops": {
    meta: UO_TARIFS_IPPON_INOPS_META,
    tarifs: UO_TARIFS_IPPON_INOPS,
    find: findUoTarifIpponInops,
  },
};

export function getUoGrilleForPorteur(
  porteurId: DevisPorteurId,
): PorteurGrille | undefined {
  return GRILLES[porteurId];
}

export function findUoTarifForPorteur(
  porteurId: DevisPorteurId,
  code: string,
): UoTarifEntry | undefined {
  return GRILLES[porteurId]?.find(code);
}

export function computeChiffrageForPorteur(
  porteurId: DevisPorteurId,
  lignes: readonly UoQuantiteLigne[],
) {
  const grille = GRILLES[porteurId];
  if (!grille) {
    return { lignes: [], totalHt: 0, totalTtc: 0 };
  }
  return computeChiffrageLignes(grille.find, lignes);
}

export function formatChiffrageForPorteur(
  porteurId: DevisPorteurId,
  lignes: readonly UoQuantiteLigne[],
): string {
  const grille = GRILLES[porteurId];
  if (!grille) {
    return "Grille tarifaire non disponible pour ce porteur.";
  }
  return formatChiffrageQuantites(grille.find, lignes, grille.meta);
}
