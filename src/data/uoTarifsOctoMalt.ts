/**
 * Grille tarifaire Octo / Malt — BPU 2MAINS Lot 4 actualisé.
 * Source : Annexe Financière - BPU Act (actualisation 1,007).
 * Fichier : 1300179400_2MAINS_L4_Gpt OCTO_BPU_Act.xlsx
 */

import {
  indexUoTarifsByKey,
  normalizeUoCodeKey,
  type UoTarifEntry,
  type UoTarifGrilleMeta,
} from "./uoTarifsShared.ts";

export type { UoTarifEntry } from "./uoTarifsShared.ts";

export const UO_TARIFS_OCTO_MALT_META: UoTarifGrilleMeta = {
  porteurId: "octo-malt",
  labelCourt: "Octo / Malt",
  source: "1300179400_2MAINS_L4_Gpt OCTO_BPU_Act.xlsx — Annexe Financière - BPU Act",
  actualisation: 1.007,
} as const;

export const UO_TARIFS_OCTO_MALT: readonly UoTarifEntry[] = [
  {
    code: "UO L4 -  F- Init marché",
    label: "Prestation d’initialisation du marché",
    kind: "forfait",
    prixHt: 5380.4,
    prixTtc: 6456.48,
  },
  {
    code: "UO L4-F-Revers marché",
    label: "Prestation de pilotage de la réversibilité en fin de marché",
    kind: "forfait",
    prixHt: 14347.74,
    prixTtc: 17217.28,
  },
  {
    code: "UO L4 - F - PEC",
    label: "Prise en charge d'un produit numérique amorcé hors de la Fabrique",
    kind: "forfait",
    prixHt: 19837.9,
    prixTtc: 23805.48,
  },
  {
    code: "UO L4 - F - Support",
    label: "Prestation de support au produit",
    kind: "forfait",
    prixHt: 18851.04,
    prixTtc: 22621.25,
  },
  {
    code: "UO L4 - F - Trans",
    label: "Prestation de transfert d'un produit hors de la fabrique",
    kind: "forfait",
    prixHt: 7633.06,
    prixTtc: 9159.67,
  },
  {
    code: "UO L4 - F - Event",
    label: "Prestation d'appui à l'organisation et l'animation d'un évènement produit",
    kind: "forfait",
    prixHt: 12275.33,
    prixTtc: 14730.4,
  },
  {
    code: "UO L4 - P - 1.1",
    label: "UO RunOps Confirmé – Exploitation et déploiement d’un service numérique",
    kind: "packaged",
    prixHt: 602.19,
    prixTtc: 722.62,
  },
  {
    code: "UO L4 - P - 1.2",
    label: "UO RunOps Senior – Exploitation et déploiement d’un service numérique",
    kind: "packaged",
    prixHt: 868.54,
    prixTtc: 1042.24,
  },
  {
    code: "UO L4 - P - 2.1",
    label: "UO DevOps Confirmé – Développement et amélioration d’une infrastructure as code",
    kind: "packaged",
    prixHt: 866.02,
    prixTtc: 1039.22,
  },
  {
    code: "UO L4 - P - 2.2",
    label: "UO DevOps Senior – Développement et amélioration d’une infrastructure as code",
    kind: "packaged",
    prixHt: 1107.7,
    prixTtc: 1329.24,
  },
  {
    code: "UO L4 - P - 3.1",
    label: "UO Dev Confirmé – Développement et amélioration continue d’un service numérique",
    kind: "packaged",
    prixHt: 800.56,
    prixTtc: 960.68,
  },
  {
    code: "UO L4 - P - 3.2",
    label: "UO Dev Senior – Développement et amélioration continue d’un service numérique",
    kind: "packaged",
    prixHt: 1107.7,
    prixTtc: 1329.24,
  },
  {
    code: "UO L4 - P - 4.1",
    label: "UO Designer Confirmé - Conception de l’expérience utilisateur",
    kind: "packaged",
    prixHt: 602.19,
    prixTtc: 722.62,
  },
  {
    code: "UO L4 - P - 4.2",
    label: "UO Designer Senior - Conception de l’expérience utilisateur",
    kind: "packaged",
    prixHt: 1107.7,
    prixTtc: 1329.24,
  },
  {
    code: "UO L4 - P - 5.1",
    label: "UO Chargé de déploiement confirmé : mise en oeuvre de la stratégie de déploiement d’un produit et de son support utilisateur",
    kind: "packaged",
    prixHt: 463.22,
    prixTtc: 555.86,
  },
  {
    code: "UO L4 - P - 5.2",
    label: "UO Chargé de déploiement senior : mise en oeuvre de la stratégie de déploiement d’un produit et de son support utilisateur",
    kind: "packaged",
    prixHt: 694.83,
    prixTtc: 833.8,
  },
  {
    code: "UO L4 - P - 6.1",
    label: "UO Product Owner confirmé : gestion de produit",
    kind: "packaged",
    prixHt: 855.95,
    prixTtc: 1027.14,
  },
  {
    code: "UO L4 - P - 6.2",
    label: "UO Product Owner senior: gestion de produit",
    kind: "packaged",
    prixHt: 1107.7,
    prixTtc: 1329.24,
  },
  {
    code: "UO L4 - P - 7",
    label: "UO Product Manager : management de produit",
    kind: "packaged",
    prixHt: 1510.5,
    prixTtc: 1812.6,
  },
  {
    code: "UO L4 - P - 8",
    label: "UO Coach : coaching d'équipe produit",
    kind: "packaged",
    prixHt: 1258.75,
    prixTtc: 1510.5,
  },
  {
    code: "UO L4 - P - 9",
    label: "UO Formation",
    kind: "packaged",
    prixHt: 4254.57,
    prixTtc: 5105.49,
  },
  {
    code: "UO L4 - P - 10",
    label: "UO Expertise Data",
    kind: "packaged",
    prixHt: 1510.5,
    prixTtc: 1812.6,
  },
  {
    code: "UO L4 - P - 11",
    label: "UO Expertise sécurité",
    kind: "packaged",
    prixHt: 1510.5,
    prixTtc: 1812.6,
  },
  {
    code: "UO L4 - P - 12",
    label: "UO Expertise numérique",
    kind: "packaged",
    prixHt: 1510.5,
    prixTtc: 1812.6,
  },
];

const TARIF_BY_KEY = indexUoTarifsByKey(UO_TARIFS_OCTO_MALT);

export function findUoTarifOctoMalt(code: string): UoTarifEntry | undefined {
  return TARIF_BY_KEY.get(normalizeUoCodeKey(code));
}
