/**
 * Référentiel UO — CCTP 2MAINS BPM031594, Lot 4 « Dev produits numériques ».
 * Codes alignés sur le BPU Hubvisory (Annexe Financière).
 */

export type UoLot4Kind = "forfait" | "packaged";

export type UoLot4Entry = {
  code: string;
  label: string;
  kind: UoLot4Kind;
  /** Indices studio / spécialité pour suggestion automatique. */
  tags: readonly string[];
};

/** UO packagées mobilisables au quotidien par le studio SPC. */
export const UO_LOT4_PACKAGED: readonly UoLot4Entry[] = [
  {
    code: "UO L4 - P - 1.1",
    label: "RunOps Confirmé — Exploitation et déploiement d'un service numérique",
    kind: "packaged",
    tags: ["runops", "ops", "infra"],
  },
  {
    code: "UO L4 - P - 1.2",
    label: "RunOps Senior — Exploitation et déploiement d'un service numérique",
    kind: "packaged",
    tags: ["runops", "ops", "infra", "senior"],
  },
  {
    code: "UO L4 - P - 2.1",
    label: "DevOps Confirmé — Développement et amélioration d'une infrastructure as code",
    kind: "packaged",
    tags: ["devops", "infra"],
  },
  {
    code: "UO L4 - P - 2.2",
    label: "DevOps Senior — Développement et amélioration d'une infrastructure as code",
    kind: "packaged",
    tags: ["devops", "infra", "senior"],
  },
  {
    code: "UO L4 - P - 3.1",
    label: "Dev Confirmé — Développement et amélioration continue d'un service numérique",
    kind: "packaged",
    tags: ["dev", "développement"],
  },
  {
    code: "UO L4 - P - 3.2",
    label: "Dev Senior — Développement et amélioration continue d'un service numérique",
    kind: "packaged",
    tags: ["dev", "développement", "senior"],
  },
  {
    code: "UO L4 - P - 4.1",
    label: "Designer Confirmé — Conception de l'expérience utilisateur",
    kind: "packaged",
    tags: ["design", "designer", "ux", "ru", "recherche utilisateur"],
  },
  {
    code: "UO L4 - P - 4.2",
    label: "Designer Senior — Conception de l'expérience utilisateur",
    kind: "packaged",
    tags: ["design", "designer", "ux", "ru", "recherche utilisateur", "senior"],
  },
  {
    code: "UO L4 - P - 5.1",
    label: "Chargé de déploiement confirmé — Stratégie de déploiement et support utilisateur",
    kind: "packaged",
    tags: ["déploiement", "deployment"],
  },
  {
    code: "UO L4 - P - 5.2",
    label: "Chargé de déploiement senior — Stratégie de déploiement et support utilisateur",
    kind: "packaged",
    tags: ["déploiement", "deployment", "senior"],
  },
  {
    code: "UO L4 - P - 6.1",
    label: "Product Owner confirmé — Gestion de produit",
    kind: "packaged",
    tags: ["product", "po", "product owner", "p4"],
  },
  {
    code: "UO L4 - P - 6.2",
    label: "Product Owner senior — Gestion de produit",
    kind: "packaged",
    tags: ["product", "po", "product owner", "p4", "senior"],
  },
  {
    code: "UO L4 - P - 7",
    label: "Product Manager — Management de produit",
    kind: "packaged",
    tags: ["product", "pm", "product manager", "p4"],
  },
  {
    code: "UO L4 - P - 8",
    label: "Coach — Coaching d'équipe produit",
    kind: "packaged",
    tags: ["coach", "coaching", "p1", "p5"],
  },
  {
    code: "UO L4 - P - 9",
    label: "Formation — Formation dans le cadre d'un produit",
    kind: "packaged",
    tags: ["formation"],
  },
  {
    code: "UO L4 - P - 10",
    label: "Expertise Data",
    kind: "packaged",
    tags: ["data", "p6"],
  },
  {
    code: "UO L4 - P - 11",
    label: "Expertise sécurité",
    kind: "packaged",
    tags: ["sécurité", "secu"],
  },
  {
    code: "UO L4 - P - 12",
    label: "Expertise numérique",
    kind: "packaged",
    tags: ["expertise"],
  },
];

export const UO_LOT4_FORFAIT: readonly UoLot4Entry[] = [
  {
    code: "UO L4 -  F- Init marché",
    label: "Initialisation du marché",
    kind: "forfait",
    tags: ["init"],
  },
  {
    code: "UO L4-F-Revers marché",
    label: "Réversibilité fin de marché",
    kind: "forfait",
    tags: ["revers"],
  },
  {
    code: "UO L4 - F - PEC",
    label: "Prise en charge d'un produit numérique amorcé hors Fabrique",
    kind: "forfait",
    tags: ["pec"],
  },
  {
    code: "UO L4 - F - Support",
    label: "Support au produit (forfait trimestriel)",
    kind: "forfait",
    tags: ["support"],
  },
  {
    code: "UO L4 - F - Trans",
    label: "Transfert d'un produit hors Fabrique",
    kind: "forfait",
    tags: ["transfert"],
  },
  {
    code: "UO L4 - F - Event",
    label: "Appui organisation et animation d'un événement produit",
    kind: "forfait",
    tags: ["event"],
  },
];

export const UO_LOT4_ALL: readonly UoLot4Entry[] = [...UO_LOT4_PACKAGED, ...UO_LOT4_FORFAIT];

export function uoLot4ByCode(code: string): UoLot4Entry | undefined {
  return UO_LOT4_ALL.find((u) => u.code === code);
}

export function uoLot4Label(code: string): string {
  const entry = uoLot4ByCode(code);
  return entry ? `${entry.code} — ${entry.label}` : code;
}
