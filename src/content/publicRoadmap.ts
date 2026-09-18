/** Feuille de route affichée sur l’accueil — langage métier uniquement. */

export type PublicRoadmapStatus = "done" | "current" | "next" | "later";

export type PublicRoadmapThemeId =
  | "consulter"
  | "prestations"
  | "cra"
  | "intervenants"
  | "suite";

export type RoadmapFlowNode = {
  id: string;
  label: string;
};

export type RoadmapFlowEdge = {
  from: string;
  to: string;
  label?: string;
};

/** Schéma structurel affiché dans le drawer d’onboarding. */
export type RoadmapDiagram = {
  nodes: RoadmapFlowNode[];
  edges: RoadmapFlowEdge[];
};

export type PublicRoadmapGuide = {
  /** Accroche : à quoi sert cette brique, pour qui. */
  lead: string;
  /** Étapes ou points clés en langage métier. */
  steps: string[];
  diagram: RoadmapDiagram;
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
    id: "livre-lecture",
    themeId: "consulter",
    title: "Consulter PA, BDC et missions ; envoyer un retour",
    summary:
      "Les parcours de lecture et le bouton « Un retour ? » sont disponibles dans le widget.",
    status: "done",
    guide: {
      lead: "Vous pouvez déjà lire le pilotage dans le widget : plans d’activité, bons de commande et missions — et signaler un problème ou une idée.",
      steps: [
        "Ouvrez Budget pour les plans d’activité et les bons de commande, ou Missions pour le détail d’un accompagnement.",
        "Sur chaque écran, vous consultez les informations utiles sans ouvrir les tables brutes.",
        "Le bouton « Un retour ? » envoie un message à l’équipe produit : question, bug ou suggestion.",
      ],
      diagram: {
        nodes: [
          { id: "nav", label: "Navigation" },
          { id: "pa", label: "Plan d’activité" },
          { id: "bdc", label: "Bon de commande" },
          { id: "missions", label: "Missions" },
          { id: "retour", label: "Un retour ?" },
        ],
        edges: [
          { from: "nav", to: "pa", label: "Budget" },
          { from: "nav", to: "bdc", label: "Budget" },
          { from: "nav", to: "missions" },
          { from: "nav", to: "retour", label: "partout" },
        ],
      },
    },
  },
  {
    id: "prestations",
    themeId: "prestations",
    title: "Modifier et gérer les prestations d’une mission",
    summary:
      "Ajouter et mettre à jour le staffing (prestations) sans repasser par les tables Grist brutes.",
    status: "done",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/31",
    guide: {
      lead: "Une mission regroupe un accompagnement. Les prestations décrivent qui intervient, sur quoi, et pour combien de jours envisagés.",
      steps: [
        "Ouvrez une mission : vous voyez le contexte et la liste des prestations.",
        "Ajoutez une prestation (intervenant, titre, jours envisagés) ou modifiez une ligne existante.",
        "Les CRA se rattachent ensuite à ces prestations : le staffing est la base du suivi.",
      ],
      diagram: {
        nodes: [
          { id: "mission", label: "Mission" },
          { id: "presta", label: "Prestation" },
          { id: "intervenant", label: "Intervenant" },
          { id: "jours", label: "Jours envisagés" },
        ],
        edges: [
          { from: "mission", to: "presta", label: "contient" },
          { from: "presta", to: "intervenant", label: "qui" },
          { from: "presta", to: "jours", label: "combien" },
        ],
      },
    },
  },
  {
    id: "cra-suivre",
    themeId: "cra",
    title: "Suivre les CRA dans le parcours de pilotage",
    summary:
      "Retrouver et lire les réalisations : page Prestation / CRA et lignes sous les missions.",
    status: "done",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/32",
    guide: {
      lead: "Le CRA décrit le travail réalisé sur une période. Vous pouvez le lire en liste transversale (Budget → Prestation / CRA) ou depuis la fiche mission.",
      steps: [
        "Ouvrir Prestation / CRA pour filtrer par mois, équipe, intervenant, produit ou bon de commande.",
        "Ou partir d’une mission et déplier les réalisations d’une prestation.",
        "Comparer le prévu et le réalisé sans ouvrir les tables brutes.",
      ],
      diagram: {
        nodes: [
          { id: "liste", label: "Liste CRA" },
          { id: "mission", label: "Fiche mission" },
          { id: "cra", label: "Réalisations" },
        ],
        edges: [
          { from: "liste", to: "cra" },
          { from: "mission", to: "cra", label: "dépliable" },
        ],
      },
    },
  },
  {
    id: "cra-recap-porteurs",
    themeId: "cra",
    title: "Générer le récap porteurs (Outils)",
    summary: "Préparer l’export mensuel groupé par portage pour envoi manuel aux ESN.",
    status: "done",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/48",
    guide: {
      lead: "En fin de mois, les managers préparent un récap par porteur (MALT, OCTO…) à partir des CRA du mois — sans e-mail automatique.",
      steps: [
        "Ouvrir Outils → Récap porteurs.",
        "Choisir le mois (et éventuellement l’équipe / le portage).",
        "Exporter (CSV) ou copier (HTML / Markdown) pour l’envoi manuel.",
      ],
      diagram: {
        nodes: [
          { id: "cra", label: "CRA du mois" },
          { id: "portage", label: "Par portage" },
          { id: "export", label: "Export" },
        ],
        edges: [
          { from: "cra", to: "portage", label: "groupe" },
          { from: "portage", to: "export" },
        ],
      },
    },
  },
  {
    id: "cra-envoyer",
    themeId: "cra",
    title: "Envoyer les CRA en fin de mois",
    summary: "Soumettre un CRA, puis le faire relire par un manager — avec des droits adaptés.",
    status: "current",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33",
    guide: {
      lead: "En fin de mois, l’intervenant déclare son activité. Un manager la relit avant qu’elle compte pour le suivi.",
      steps: [
        "L’intervenant renseigne ou confirme les jours réalisés sur ses prestations.",
        "Il envoie le CRA pour relecture (ce n’est plus un brouillon).",
        "Le manager valide ou demande une correction — selon les droits de chacun.",
      ],
      diagram: {
        nodes: [
          { id: "saisie", label: "Saisie CRA" },
          { id: "envoi", label: "Envoi" },
          { id: "relecture", label: "Relecture manager" },
          { id: "ok", label: "Validé" },
        ],
        edges: [
          { from: "saisie", to: "envoi" },
          { from: "envoi", to: "relecture" },
          { from: "relecture", to: "ok", label: "ou correction" },
        ],
      },
    },
  },
  {
    id: "cra-qualifier",
    themeId: "cra",
    title: "Qualifier un CRA et le lier au bon de commande",
    summary: "Associer le CRA au bon de commande (chaîne jusqu’au plan d’activité).",
    status: "next",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/34",
    guide: {
      lead: "Une fois le CRA relu, on le rattache au bon de commande pour que la dépense remonte correctement jusqu’au plan d’activité.",
      steps: [
        "Qualifier le CRA : confirmer la prestation et la période.",
        "Le lier au bon de commande concerné.",
        "Le suivi budget (plan d’activité → bon de commande → réalisations) reste cohérent.",
      ],
      diagram: {
        nodes: [
          { id: "cra", label: "CRA validé" },
          { id: "bdc", label: "Bon de commande" },
          { id: "pa", label: "Plan d’activité" },
        ],
        edges: [
          { from: "cra", to: "bdc", label: "lié à" },
          { from: "bdc", to: "pa", label: "finance" },
        ],
      },
    },
  },
  {
    id: "droits-prep",
    themeId: "intervenants",
    title: "Préparer les droits Grist avant l’envoi des CRA",
    summary:
      "Rôles pilotes, correspondance compte ↔ intervenant, et règles sur les réalisations.",
    status: "next",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47",
    guide: {
      lead: "Avant d’ouvrir la soumission des CRA, les droits du document doivent être clairs : qui voit et modifie quelles réalisations.",
      steps: [
        "Renseigner le rôle pour quelques comptes de test (admin, responsable, freelance).",
        "S’assurer que l’e-mail du compte Grist correspond à la fiche intervenant.",
        "Valider la matrice sur les réalisations, puis tester « voir comme » un autre profil.",
      ],
      diagram: {
        nodes: [
          { id: "roles", label: "Rôles" },
          { id: "regles", label: "Règles document" },
          { id: "test", label: "Voir comme…" },
        ],
        edges: [
          { from: "roles", to: "regles" },
          { from: "regles", to: "test" },
        ],
      },
    },
  },
  {
    id: "intervenants-droits",
    themeId: "intervenants",
    title: "Intervenants et qui voit / fait quoi",
    summary: "Consulter les intervenants et clarifier les droits selon les rôles.",
    status: "next",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/35",
    guide: {
      lead: "Tout le monde n’a pas le même rôle : freelance, manager, admin. Cette brique clarifie qui peut voir ou modifier quoi.",
      steps: [
        "Consulter la liste des intervenants liés au pilotage.",
        "Comprendre les droits selon le rôle (lire, envoyer un CRA, valider, etc.).",
        "Éviter les surprises : chacun travaille dans le périmètre qui lui est ouvert.",
      ],
      diagram: {
        nodes: [
          { id: "roles", label: "Rôles" },
          { id: "voir", label: "Voir" },
          { id: "agir", label: "Agir" },
          { id: "ecrans", label: "Écrans adaptés" },
        ],
        edges: [
          { from: "roles", to: "voir" },
          { from: "roles", to: "agir" },
          { from: "voir", to: "ecrans" },
          { from: "agir", to: "ecrans" },
        ],
      },
    },
  },
  {
    id: "produits-pv",
    themeId: "suite",
    title: "Catalogue Produits, procès-verbaux, évaluations",
    summary: "Écrans utiles, mais après le cœur pilotage missions / CRA / droits.",
    status: "later",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/3",
    guide: {
      lead: "Après le cœur missions / CRA / droits, d’autres écrans enrichiront le pilotage : catalogue produits, procès-verbaux, évaluations.",
      steps: [
        "Produits : retrouver le catalogue lié aux missions.",
        "Procès-verbaux : formaliser les étapes clés d’un accompagnement.",
        "Évaluations : capitaliser sur le retour d’expérience — sans bloquer le suivi CRA actuel.",
      ],
      diagram: {
        nodes: [
          { id: "coeur", label: "Missions · CRA · droits" },
          { id: "produits", label: "Produits" },
          { id: "pv", label: "Procès-verbaux" },
          { id: "eval", label: "Évaluations" },
        ],
        edges: [
          { from: "coeur", to: "produits", label: "ensuite" },
          { from: "coeur", to: "pv", label: "ensuite" },
          { from: "coeur", to: "eval", label: "ensuite" },
        ],
      },
    },
  },
  {
    id: "forfait",
    themeId: "suite",
    title: "Prestataires au forfait",
    summary: "Parcours distinct du modèle jour-homme / CRA (entreprises prestataires).",
    status: "later",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/36",
    guide: {
      lead: "Aujourd’hui le parcours principal suit les jours-homme et les CRA. Les prestataires au forfait auront un parcours distinct, adapté à leur mode de facturation.",
      steps: [
        "Identifier une prestation « forfait » (entreprise), distincte du freelance au jour.",
        "Suivre l’avancement sans imposer le même cycle CRA mensuel.",
        "Garder le lien avec la mission et le budget, avec des étapes propres au forfait.",
      ],
      diagram: {
        nodes: [
          { id: "mission", label: "Mission" },
          { id: "jh", label: "Jour-homme / CRA" },
          { id: "forfait", label: "Forfait" },
        ],
        edges: [
          { from: "mission", to: "jh", label: "parcours A" },
          { from: "mission", to: "forfait", label: "parcours B" },
        ],
      },
    },
  },
  {
    id: "dates-cra",
    themeId: "suite",
    title: "Dates d’une prestation dérivées des CRA",
    summary:
      "Hypothèse : la fenêtre temporelle vient des mois de CRA, pas d’une saisie début/fin à part.",
    status: "later",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/37",
    guide: {
      lead: "Plutôt que de saisir à la main une date de début et de fin sur chaque prestation, on s’appuie sur les mois réellement couverts par les CRA.",
      steps: [
        "Les CRA du mois indiquent quand la prestation est active.",
        "La fenêtre visible sur la fiche se construit à partir de ces mois.",
        "Moins de double saisie, moins d’écarts entre « prévu » et « réalisé ».",
      ],
      diagram: {
        nodes: [
          { id: "cra", label: "CRA des mois" },
          { id: "fenetre", label: "Fenêtre de la prestation" },
          { id: "fiche", label: "Fiche mission" },
        ],
        edges: [
          { from: "cra", to: "fenetre", label: "dérive" },
          { from: "fenetre", to: "fiche", label: "affiche" },
        ],
      },
    },
  },
  {
    id: "mission-contexte-edit",
    themeId: "suite",
    title: "Éditer le contexte d’une mission depuis la fiche",
    summary:
      "Mettre à jour demande, enjeux, historique et liens sans repasser par les tables Grist.",
    status: "later",
    issueUrl: "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/43",
    guide: {
      lead: "Le contexte d’une mission (demande, enjeux, historique, liens) se lit déjà sur la fiche. L’étape suivante : pouvoir le mettre à jour au même endroit.",
      steps: [
        "Ouvrir la fiche mission et le bloc contexte.",
        "Modifier le texte utile (demande, enjeux, historique, liens).",
        "Enregistrer : toute l’équipe voit la même version à jour.",
      ],
      diagram: {
        nodes: [
          { id: "fiche", label: "Fiche mission" },
          { id: "contexte", label: "Contexte" },
          { id: "maj", label: "Mise à jour" },
        ],
        edges: [
          { from: "fiche", to: "contexte", label: "contient" },
          { from: "contexte", to: "maj", label: "éditer" },
        ],
      },
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
