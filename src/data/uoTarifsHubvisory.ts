/**
 * Grille tarifaire Hubvisory / Numércité / Opteamis — BPU 2MAINS Lot 4 actualisé.
 * Source : Annexe Financière - BPU Act (actualisation 1,007).
 * Fichier : 1300179410_ 2MAINS_L4_Gpt Hubvisoyr_BPU_Act.xlsx
 */

import {
  indexUoTarifsByKey,
  normalizeUoCodeKey,
  type UoTarifEntry,
  type UoTarifGrilleMeta,
} from "./uoTarifsShared.ts";

export type { UoTarifEntry, UoChiffrageLigne, UoQuantiteLigne } from "./uoTarifsShared.ts";
export { formatEuro } from "./uoTarifsShared.ts";

export const UO_TARIFS_HUBVISORY_META: UoTarifGrilleMeta = {
  porteurId: "hubvisory-numercite-opteamis",
  labelCourt: "Hubvisory / Numércité / Opteamis",
  source: "1300179410_ 2MAINS_L4_Gpt Hubvisoyr_BPU_Act.xlsx — Annexe Financière - BPU Act",
  actualisation: 1.007,
} as const;

export const UO_TARIFS_HUBVISORY: readonly UoTarifEntry[] = [
  {
    code: "UO L4 -  F- Init marché",
    label: "Prestation d'initialisation du marché",
    kind: "forfait",
    prixHt: 7049,
    prixTtc: 8458.8,
  },
  {
    code: "UO L4-F-Revers marché",
    label: "Prestation de pilotage de la réversibilité en fin de marché",
    kind: "forfait",
    prixHt: 4028,
    prixTtc: 4833.6,
  },
  {
    code: "UO L4 - F - PEC",
    label: "Prise en charge d'un produit numérique amorcé hors de la Fabrique",
    kind: "forfait",
    prixHt: 12084,
    prixTtc: 14500.8,
  },
  {
    code: "UO L4 - F - Support",
    label: "Prestation de support au produit",
    kind: "forfait",
    prixHt: 8056,
    prixTtc: 9667.2,
  },
  {
    code: "UO L4 - F - Trans",
    label: "Prestation de transfert d'un produit hors de la fabrique",
    kind: "forfait",
    prixHt: 8056,
    prixTtc: 9667.2,
  },
  {
    code: "UO L4 - F - Event",
    label: "Prestation d'appui à l'organisation et l'animation d'un évènement produit",
    kind: "forfait",
    prixHt: 4531.5,
    prixTtc: 5437.8,
  },
  {
    code: "UO L4 - P - 1.1",
    label: "UO RunOps Confirmé – Exploitation et déploiement d'un service numérique",
    kind: "packaged",
    prixHt: 604.2,
    prixTtc: 725.04,
  },
  {
    code: "UO L4 - P - 1.2",
    label: "UO RunOps Senior – Exploitation et déploiement d'un service numérique",
    kind: "packaged",
    prixHt: 679.72,
    prixTtc: 815.67,
  },
  {
    code: "UO L4 - P - 2.1",
    label: "UO DevOps Confirmé – Développement et amélioration d'une infrastructure as code",
    kind: "packaged",
    prixHt: 654.55,
    prixTtc: 785.46,
  },
  {
    code: "UO L4 - P - 2.2",
    label: "UO DevOps Senior – Développement et amélioration d'une infrastructure as code",
    kind: "packaged",
    prixHt: 805.6,
    prixTtc: 966.72,
  },
  {
    code: "UO L4 - P - 3.1",
    label: "UO Dev Confirmé – Développement et amélioration continue d'un service numérique",
    kind: "packaged",
    prixHt: 553.85,
    prixTtc: 664.62,
  },
  {
    code: "UO L4 - P - 3.2",
    label: "UO Dev Senior – Développement et amélioration continue d'un service numérique",
    kind: "packaged",
    prixHt: 654.55,
    prixTtc: 785.46,
  },
  {
    code: "UO L4 - P - 4.1",
    label: "UO Designer Confirmé - Conception de l'expérience utilisateur",
    kind: "packaged",
    prixHt: 604.2,
    prixTtc: 725.04,
  },
  {
    code: "UO L4 - P - 4.2",
    label: "UO Designer Senior - Conception de l'expérience utilisateur",
    kind: "packaged",
    prixHt: 755.25,
    prixTtc: 906.3,
  },
  {
    code: "UO L4 - P - 5.1",
    label: "UO Chargé de déploiement confirmé : stratégie de déploiement et support utilisateur",
    kind: "packaged",
    prixHt: 453.15,
    prixTtc: 543.78,
  },
  {
    code: "UO L4 - P - 5.2",
    label: "UO Chargé de déploiement senior : stratégie de déploiement et support utilisateur",
    kind: "packaged",
    prixHt: 533.71,
    prixTtc: 640.45,
  },
  {
    code: "UO L4 - P - 6.1",
    label: "UO Product Owner confirmé : gestion de produit",
    kind: "packaged",
    prixHt: 654.55,
    prixTtc: 785.46,
  },
  {
    code: "UO L4 - P - 6.2",
    label: "UO Product Owner senior: gestion de produit",
    kind: "packaged",
    prixHt: 755.25,
    prixTtc: 906.3,
  },
  {
    code: "UO L4 - P - 7",
    label: "UO Product Manager : management de produit",
    kind: "packaged",
    prixHt: 805.6,
    prixTtc: 966.72,
  },
  {
    code: "UO L4 - P - 8",
    label: "UO Coach : coaching d'équipe produit",
    kind: "packaged",
    prixHt: 956.65,
    prixTtc: 1147.98,
  },
  {
    code: "UO L4 - P - 9",
    label: "UO Formation",
    kind: "packaged",
    prixHt: 5035,
    prixTtc: 6042,
  },
  {
    code: "UO L4 - P - 10",
    label: "UO Expertise Data",
    kind: "packaged",
    prixHt: 956.65,
    prixTtc: 1147.98,
  },
  {
    code: "UO L4 - P - 11",
    label: "UO Expertise sécurité",
    kind: "packaged",
    prixHt: 956.65,
    prixTtc: 1147.98,
  },
  {
    code: "UO L4 - P - 12",
    label: "UO Expertise numérique",
    kind: "packaged",
    prixHt: 956.65,
    prixTtc: 1147.98,
  },
];

const TARIF_BY_KEY = indexUoTarifsByKey(UO_TARIFS_HUBVISORY);

export function findUoTarifHubvisory(code: string): UoTarifEntry | undefined {
  return TARIF_BY_KEY.get(normalizeUoCodeKey(code));
}

