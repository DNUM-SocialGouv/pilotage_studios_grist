/** Feuille de route affichée sur l’accueil — langage métier uniquement. */

export type PublicRoadmapStatus = "done" | "current" | "next" | "later";

export type PublicRoadmapThemeId =
  "consulter" | "prestations" | "cra" | "intervenants" | "suite";

export type PublicRoadmapGuide = {
  /** Accroche : à quoi sert cette brique, pour qui. */
  lead: string;
  /** Intro optionnelle avant la liste (ex. « Sur la fiche, vous voyez : »). */
  stepsIntro?: string;
  /** Étapes ou points clés en langage métier. */
  steps: string[];
  /** Lien MemoryRouter vers l’écran concerné (ferme le drawer). */
  pagePath?: string;
  /** Libellé du lien interne (défaut : « Ouvrir la page »). */
  pageLinkLabel?: string;
};

export type PublicRoadmapItem = {
  id: string;
  themeId: PublicRoadmapThemeId;
  title: string;
  /** Courte promesse pour les utilisateurs (pas de jargon technique). */
  summary: string;
  status: PublicRoadmapStatus;
  /** Issue GitHub publique pour discuter — absente si déjà livré sans ticket. */
  issueUrl?: string;
  guide: PublicRoadmapGuide;
};

export type PublicRoadmapTheme = {
  id: PublicRoadmapThemeId;
  label: string;
};

export const PUBLIC_ROADMAP_THEMES: PublicRoadmapTheme[] = [
  { id: "consulter", label: "Consulter le pilotage" },
  { id: "prestations", label: "Prestations" },
  { id: "cra", label: "CRA" },
  { id: "intervenants", label: "Intervenants et droits" },
  { id: "suite", label: "Suite" },
];

export const PUBLIC_ROADMAP_INTRO =
  "On construit progressivement une interface claire pour suivre les missions, les prestations et les CRA — sans passer par les tables Grist.";

export const PUBLIC_ROADMAP_CTA =
  "Une question ou une idée ? Commentez sur GitHub, ou utilisez « Un retour ? ».";

export const PUBLIC_ROADMAP_ITEMS: PublicRoadmapItem[] = [
  {
    id: "consulter-pa",
    themeId: "consulter",
    title: "Consulter un plan d’activité",
    summary:
      "Lister et ouvrir un PA pour suivre le budget engagé et le reste à consommer.",
    status: "done",
    guide: {
      lead: "Le plan d’activité (PA) regroupe le budget d’un périmètre et ses bons de commande.",
      stepsIntro:
        "Dans la fiche d’un PA, vous pouvez visualiser ses informations :",
      steps: [
        "Le montant total",
        "Les sommes totales engagées via les bons de commande",
        "Ce qui a été payé et enregistré dans Sofiane",
        "Le reste à consommer",
      ],
      pagePath: "/pa",
      pageLinkLabel: "Ouvrir Plans d’activité",
    },
  },
  {
    id: "consulter-bdc",
    themeId: "consulter",
    title: "Consulter un bon de commande",
    summary:
      "Lister et ouvrir un BDC pour voir le cadre de commande et les dépenses associées.",
    status: "done",
    guide: {
      lead: "Le bon de commande (BDC) formalise une commande rattachée à un plan d’activité.",
      stepsIntro:
        "Dans la fiche d’un BDC, vous pouvez visualiser ses informations :",
      steps: [
        "Le budget TTC et le total consommé (CRA)",
        "Le solde et le pourcentage consommé",
        "Les dépenses liées (missions, prestations, CRA)",
        "Les informations (PA, équipe, Sofiane, devis…)",
      ],
      pagePath: "/bdc",
      pageLinkLabel: "Ouvrir Bons de commande",
    },
  },
  {
    id: "consulter-mission",
    themeId: "consulter",
    title: "Consulter une mission",
    summary:
      "Lister et ouvrir une mission pour le contexte d’accompagnement et son staffing.",
    status: "done",
    guide: {
      lead: "Une mission décrit un accompagnement : contexte, produit et prestations (staffing).",
      stepsIntro:
        "Dans la fiche d’une mission, vous pouvez visualiser ses informations :",
      steps: [
        "Le statut, le produit et le département",
        "Le contexte (demande, enjeux, historique, liens)",
        "L’équipe et les prestations (jours envisagés, CRA dépliables)",
        "Les notes et pièces jointes",
      ],
      pagePath: "/missions",
      pageLinkLabel: "Ouvrir Missions",
    },
  },
  {
    id: "envoyer-retour",
    themeId: "consulter",
    title: "Envoyer un retour",
    summary:
      "Signaler une question, un bug ou une idée via le bouton « Un retour ? ».",
    status: "done",
    guide: {
      lead: "Le bouton « Un retour ? » (bas à droite) envoie un message à l’équipe produit depuis n’importe quel écran.",
      stepsIntro: "Dans le panneau, vous renseignez :",
      steps: [
        "Le type de retour (anomalie, suggestion ou question)",
        "La page concernée (préremplie selon l’écran)",
        "Votre message et votre identité (liste Équipe)",
        "Le niveau de gêne, si le type est une anomalie",
      ],
    },
  },
  {
    id: "prestations",
    themeId: "prestations",
    title: "Modifier et gérer les prestations d’une mission",
    summary:
      "Ajouter et mettre à jour le staffing (prestations) sans repasser par les tables Grist brutes.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/31",
    guide: {
      lead: "Les prestations décrivent qui intervient sur une mission, sur quoi, et pour combien de jours envisagés.",
      stepsIntro:
        "Depuis la fiche mission (onglet Équipe & prestations), vous pouvez :",
      steps: [
        "Consulter la liste des prestations et leurs CRA",
        "Ajouter une prestation (titre, intervenant, jours, statut)",
        "Modifier une prestation existante",
      ],
      pagePath: "/missions",
      pageLinkLabel: "Ouvrir Missions",
    },
  },
  {
    id: "cra-suivre",
    themeId: "cra",
    title: "Suivre les CRA dans le parcours de pilotage",
    summary:
      "Retrouver et lire les réalisations : page Prestation / CRA et lignes sous les missions.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/32",
    guide: {
      lead: "Une réalisation (CRA) décrit le travail réalisé sur une période : jours, tâches et rattachements.",
      stepsIntro: "Sur la page Prestation / CRA, vous pouvez :",
      steps: [
        "Filtrer par mois, équipe, intervenant, produit ou bon de commande",
        "Consulter les jours et montants réalisés",
        "Retrouver le lien avec la mission et le BDC",
      ],
      pagePath: "/cra",
      pageLinkLabel: "Ouvrir Prestation / CRA",
    },
  },
  {
    id: "cra-recap-porteurs",
    themeId: "cra",
    title: "Générer le récap porteurs (Outils)",
    summary:
      "Préparer l’export mensuel groupé par portage pour envoi manuel aux ESN.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/48",
    guide: {
      lead: "Le récap porteurs prépare l’export mensuel des CRA groupés par portage (MALT, OCTO…), pour envoi manuel.",
      stepsIntro: "Sur la page Récap porteurs, vous pouvez :",
      steps: [
        "Choisir le mois (et éventuellement l’équipe ou le portage)",
        "Voir le regroupement des CRA par porteur",
        "Exporter en CSV ou copier en HTML / Markdown",
      ],
      pagePath: "/outils/recap-porteurs",
      pageLinkLabel: "Ouvrir Récap porteurs",
    },
  },
  {
    id: "cra-envoyer",
    themeId: "cra",
    title: "Envoyer les CRA en fin de mois",
    summary:
      "Soumettre un CRA, puis le faire relire par un manager — avec des droits adaptés.",
    status: "next",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33",
    guide: {
      lead: "En fin de mois, l’intervenant déclare son activité. Un manager la relit avant qu’elle compte pour le suivi.",
      stepsIntro: "Quand ce parcours sera livré, vous pourrez :",
      steps: [
        "Renseigner ou confirmer les jours réalisés sur vos prestations",
        "Envoyer le CRA pour relecture (ce n’est plus un brouillon)",
        "Faire valider ou corriger par un manager, selon les droits",
      ],
    },
  },
  {
    id: "cra-qualifier",
    themeId: "cra",
    title: "Qualifier un CRA et le lier au bon de commande",
    summary:
      "Associer le CRA au bon de commande (chaîne jusqu’au plan d’activité).",
    status: "next",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/34",
    guide: {
      lead: "Une fois le CRA relu, on le rattache au bon de commande pour que la dépense remonte correctement jusqu’au plan d’activité.",
      stepsIntro: "Quand ce parcours sera livré, vous pourrez :",
      steps: [
        "Qualifier le CRA (prestation et période)",
        "Le lier au bon de commande concerné",
        "Garder le suivi budget cohérent (PA → BDC → réalisations)",
      ],
    },
  },
  {
    id: "droits-menus",
    themeId: "intervenants",
    title: "Menus adaptés au rôle de chacun",
    summary:
      "Admin, responsable, freelance ou invité : le menu montre seulement les écrans autorisés (budget / CRA réservés).",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47",
    guide: {
      lead: "Chacun a un rôle dans le pilotage. Le widget s’aligne dessus pour n’afficher que les pages utiles — sans ouvrir le budget à tout le monde.",
      stepsIntro: "En pratique :",
      steps: [
        "Votre compte est relié à votre fiche équipe (e-mail)",
        "Le rôle (Admin, responsable, freelance, invité) détermine les pages visibles",
        "Plans d’activité, bons de commande, CRA et récap porteurs restent réservés aux profils autorisés",
        "Missions (et écrans ouverts à tous) restent accessibles selon la matrice",
      ],
    },
  },
  {
    id: "droits-prep",
    themeId: "intervenants",
    title: "Affiner les droits sur les réalisations (CRA)",
    summary:
      "Avant l’envoi des CRA : qui peut lire ou modifier quelles lignes de réalisations — testé « voir comme ».",
    status: "current",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47",
    guide: {
      lead: "Les menus sont filtrés. Reste à protéger les données de réalisations elles-mêmes, pour qu’un freelance ne voie ou ne modifie que son périmètre.",
      stepsIntro: "Travail en cours :",
      steps: [
        "Définir qui lit / modifie quelles réalisations selon le rôle",
        "Tester avec « voir comme » (admin, responsable, freelance)",
        "Débloquer ensuite l’envoi des CRA en fin de mois en confiance",
      ],
    },
  },
  {
    id: "intervenants-droits",
    themeId: "intervenants",
    title: "Intervenants et qui voit / fait quoi",
    summary:
      "Consulter les intervenants et clarifier les droits selon les rôles.",
    status: "next",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/35",
    guide: {
      lead: "Tout le monde n’a pas le même rôle : freelance, manager, admin. Cette brique clarifie qui peut voir ou modifier quoi.",
      stepsIntro: "Quand cet écran sera livré, vous pourrez :",
      steps: [
        "Consulter la liste des intervenants liés au pilotage",
        "Comprendre les droits selon le rôle (lire, envoyer un CRA, valider…)",
        "Travailler chacun dans le périmètre qui lui est ouvert",
      ],
    },
  },
  {
    id: "produits-pv",
    themeId: "suite",
    title: "Catalogue Produits, procès-verbaux, évaluations",
    summary:
      "Écrans utiles, mais après le cœur pilotage missions / CRA / droits.",
    status: "later",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3",
    guide: {
      lead: "Après le cœur missions / CRA / droits, d’autres écrans enrichiront le pilotage.",
      stepsIntro: "À venir, notamment :",
      steps: [
        "Le catalogue Produits lié aux missions",
        "Les procès-verbaux pour formaliser les étapes d’un accompagnement",
        "Les évaluations pour capitaliser le retour d’expérience",
      ],
    },
  },
  {
    id: "forfait",
    themeId: "suite",
    title: "Prestataires au forfait",
    summary:
      "Parcours distinct du modèle jour-homme / CRA (entreprises prestataires).",
    status: "later",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/36",
    guide: {
      lead: "Aujourd’hui le parcours principal suit les jours-homme et les CRA. Les prestataires au forfait auront un parcours distinct.",
      stepsIntro: "Quand ce parcours sera livré, vous pourrez :",
      steps: [
        "Identifier une prestation « forfait » (entreprise), distincte du freelance au jour",
        "Suivre l’avancement sans imposer le même cycle CRA mensuel",
        "Garder le lien avec la mission et le budget",
      ],
    },
  },
  {
    id: "dates-cra",
    themeId: "suite",
    title: "Dates d’une prestation dérivées des CRA",
    summary:
      "Hypothèse : la fenêtre temporelle vient des mois de CRA, pas d’une saisie début/fin à part.",
    status: "later",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/37",
    guide: {
      lead: "Plutôt que de saisir à la main une date de début et de fin sur chaque prestation, on s’appuie sur les mois réellement couverts par les CRA.",
      stepsIntro: "Quand cette règle sera en place :",
      steps: [
        "Les CRA du mois indiquent quand la prestation est active",
        "La fenêtre visible sur la fiche se construit à partir de ces mois",
        "Moins de double saisie entre « prévu » et « réalisé »",
      ],
    },
  },
  {
    id: "mission-contexte-edit",
    themeId: "suite",
    title: "Éditer le contexte d’une mission depuis la fiche",
    summary:
      "Mettre à jour demande, enjeux, historique et liens sans repasser par les tables Grist.",
    status: "later",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/43",
    guide: {
      lead: "Le contexte d’une mission (demande, enjeux, historique, liens) se lit déjà sur la fiche. L’étape suivante : pouvoir le mettre à jour au même endroit.",
      stepsIntro: "Quand l’édition sera livrée, vous pourrez :",
      steps: [
        "Ouvrir le bloc contexte sur la fiche mission",
        "Modifier le texte utile (demande, enjeux, historique, liens)",
        "Enregistrer pour que toute l’équipe voie la même version",
      ],
      pagePath: "/missions",
      pageLinkLabel: "Ouvrir Missions",
    },
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

/** Colonnes kanban accueil (gauche → droite). */
export type RoadmapKanbanColumnId = "backlog" | "en_cours" | "livre";

export type RoadmapKanbanColumn = {
  id: RoadmapKanbanColumnId;
  label: string;
};

export const ROADMAP_KANBAN_COLUMNS: RoadmapKanbanColumn[] = [
  { id: "backlog", label: "Backlog" },
  { id: "en_cours", label: "En cours" },
  { id: "livre", label: "Livré" },
];

export type PublicRoadmapKanbanGroup = {
  column: RoadmapKanbanColumn;
  items: PublicRoadmapItem[];
};

export type PublicRoadmapThemeGroup = {
  theme: PublicRoadmapTheme;
  items: PublicRoadmapItem[];
};

/** Mappe le statut produit vers une colonne kanban. */
export function roadmapStatusToKanbanColumn(
  status: PublicRoadmapStatus,
): RoadmapKanbanColumnId {
  if (status === "done") return "livre";
  if (status === "current") return "en_cours";
  return "backlog";
}

/** Regroupe les items en colonnes Backlog → En cours → Livré (ordre source conservé). */
export function groupPublicRoadmapByKanban(
  items: PublicRoadmapItem[] = PUBLIC_ROADMAP_ITEMS,
): PublicRoadmapKanbanGroup[] {
  return ROADMAP_KANBAN_COLUMNS.map((column) => ({
    column,
    items: items.filter(
      (item) => roadmapStatusToKanbanColumn(item.status) === column.id,
    ),
  }));
}

/** Regroupe les items dans l’ordre des thèmes (thèmes vides omis). */
export function groupPublicRoadmapByTheme(
  items: PublicRoadmapItem[] = PUBLIC_ROADMAP_ITEMS,
): PublicRoadmapThemeGroup[] {
  return PUBLIC_ROADMAP_THEMES.map((theme) => ({
    theme,
    items: items.filter((item) => item.themeId === theme.id),
  })).filter((group) => group.items.length > 0);
}
