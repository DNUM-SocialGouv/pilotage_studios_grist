/** Feuille de route affichée sur l’accueil — langage métier uniquement. */

export type PublicRoadmapStatus = "done" | "current" | "next" | "later";

export type PublicRoadmapItem = {
  id: string;
  title: string;
  /** Courte promesse pour les utilisateurs (pas de jargon technique). */
  summary: string;
  status: PublicRoadmapStatus;
  /** Issue GitHub publique pour discuter — absente si déjà livré sans ticket. */
  issueUrl?: string;
};

export const PUBLIC_ROADMAP_INTRO =
  "On consolide le pilotage : prestations des missions, puis le parcours CRA jusqu’au bon de commande, avec des droits clairs.";

export const PUBLIC_ROADMAP_ITEMS: PublicRoadmapItem[] = [
  {
    id: "livre-lecture",
    title: "Consulter PA, BDC et missions ; envoyer un retour",
    summary: "Les parcours de lecture et le bouton « Un retour ? » sont disponibles dans le widget.",
    status: "done",
  },
  {
    id: "prestations",
    title: "Modifier et gérer les prestations d’une mission",
    summary: "Ajouter et mettre à jour le staffing (prestations) sans repasser par les tables Grist brutes.",
    status: "current",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/31",
  },
  {
    id: "cra-suivre",
    title: "Suivre les CRA dans le parcours de pilotage",
    summary: "Retrouver et lire les réalisations du mois dans le parcours métier.",
    status: "next",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/32",
  },
  {
    id: "cra-envoyer",
    title: "Envoyer les CRA en fin de mois",
    summary: "Soumettre un CRA, puis le faire relire par un manager — avec des droits adaptés.",
    status: "next",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33",
  },
  {
    id: "cra-qualifier",
    title: "Qualifier un CRA et le lier au bon de commande",
    summary: "Associer le CRA au bon bon de commande (chaîne jusqu’au plan d’activité).",
    status: "next",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/34",
  },
  {
    id: "intervenants-droits",
    title: "Intervenants et qui voit / fait quoi",
    summary: "Consulter les intervenants et clarifier les droits selon les rôles.",
    status: "next",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/35",
  },
  {
    id: "produits-pv",
    title: "Catalogue Produits, procès-verbaux, évaluations",
    summary: "Écrans utiles, mais après le cœur pilotage missions / CRA / droits.",
    status: "later",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3",
  },
  {
    id: "forfait",
    title: "Prestataires au forfait",
    summary: "Parcours distinct du modèle jour-homme / CRA (entreprises prestataires).",
    status: "later",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/36",
  },
  {
    id: "dates-cra",
    title: "Dates d’une prestation dérivées des CRA",
    summary: "Hypothèse : la fenêtre temporelle vient des mois de CRA, pas d’une saisie début/fin à part.",
    status: "later",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/37",
  },
];

export const ROADMAP_STATUS_LABEL: Record<PublicRoadmapStatus, string> = {
  done: "Fait",
  current: "En cours",
  next: "À venir",
  later: "Plus tard",
};

/** Badge DSFR : neutre / new / info / contrast selon le statut. */
export const ROADMAP_STATUS_BADGE_CLASS: Record<PublicRoadmapStatus, string> = {
  done: "fr-badge--success",
  current: "fr-badge--new",
  next: "fr-badge--info",
  later: "",
};
