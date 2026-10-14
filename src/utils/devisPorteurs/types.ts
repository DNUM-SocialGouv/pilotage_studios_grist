export type DevisPorteurId =
  | "octo-malt"
  | "hubvisory-numercite-opteamis"
  | "ippon-inops";

/**
 * Schéma de rédaction du devis (indépendant de la grille BPU, dispatchée par `id` porteur).
 * V1 : seul le format Opteamis est implémenté ; d’autres schémas s’ajouteront ici.
 */
export type DevisSchemaId = "opteamis";

export type DevisPorteurDef = {
  id: DevisPorteurId;
  /** Libellé groupement (plusieurs entreprises). */
  label: string;
  /** Entreprises du groupement. */
  entreprises: readonly string[];
  /** Disponible dans l'app. */
  enabled: boolean;
  description: string;
  /** Format de rédaction du texte exporté. */
  schemaId: DevisSchemaId;
};

export const DEVIS_PORTEURS: readonly DevisPorteurDef[] = [
  {
    id: "octo-malt",
    label: "Octo / Malt",
    entreprises: ["OCTO Technology", "MALT Community"],
    enabled: true,
    description:
      "Devis marché 2MAINS — form. Opteamis (schéma 5 sections + RGPD à venir), grille BPU Octo/Malt",
    schemaId: "opteamis",
  },
  {
    id: "hubvisory-numercite-opteamis",
    label: "Hubvisory / Numércité / Opteamis",
    entreprises: ["Hubvisory", "Numércité", "Opteamis"],
    enabled: true,
    description: "Devis marché 2MAINS — format Opteamis, grille BPU Hubvisory",
    schemaId: "opteamis",
  },
  {
    id: "ippon-inops",
    label: "IPPON / Inop's",
    entreprises: ["IPPON", "Inop's"],
    enabled: true,
    description: "Devis marché 2MAINS — format Opteamis, grille BPU IPPON / Inop's",
    schemaId: "opteamis",
  },
];

export const DEVIS_PORTEUR_V1_ID: DevisPorteurId = "hubvisory-numercite-opteamis";

/** Champs du schéma Opteamis (texte copiable) — les 3 porteurs en V1. */
export type OpteamisDevisFields = {
  nomProjet: string;
  /** Valeurs du choix Grist BDC « Financeur ». */
  financeur: string;
  /** Valeurs du choix Grist BDC « Équipe » (Equipe2), une ou plusieurs. */
  equipes: string;
  demandeContexte: string;
  livrablesAttendus: string;
  /** Dates HTML `YYYY-MM-DD` — affichées formatées dans le texte exporté. */
  periodeDebut: string;
  periodeFin: string;
  uoConcernees: string;
  informationsChiffrage: string;
  /**
   * Découpe PV (tableau Markdown) — exportée sous le chiffrage UO.
   * Vide si non calculable (quantités non entières, nb PV manquant, etc.).
   */
  decoupePv: string;
};

export const EMPTY_OPTEAMIS_DEVIS_FIELDS: OpteamisDevisFields = {
  nomProjet: "",
  financeur: "",
  equipes: "",
  demandeContexte: "",
  livrablesAttendus: "",
  periodeDebut: "",
  periodeFin: "",
  uoConcernees: "",
  informationsChiffrage: "",
  decoupePv: "",
};
