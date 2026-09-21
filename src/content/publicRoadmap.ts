/** Feuille de route affichée sur l’accueil — langage métier uniquement. */

export type PublicRoadmapStatus = "done" | "current" | "next" | "later";

export type PublicRoadmapThemeId =
  "consulter" | "prestations" | "cra" | "equipe" | "suite";

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
  { id: "equipe", label: "Équipe et droits" },
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
    id: "droits-menus",    themeId: "equipe",
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
    themeId: "equipe",
    title: "Affiner les droits sur les réalisations (CRA)",
    summary:
      "Maintenant que la déclaration est ouverte : qui peut lire ou modifier quelles lignes de réalisations — testé « voir comme ».",
    status: "current",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/47",
    guide: {
      lead: "Les menus sont filtrés et la déclaration CRA est déjà possible. Reste à protéger les lignes de réalisations elles-mêmes, pour qu’un freelance ne voie ou ne modifie que son périmètre.",
      stepsIntro: "Travail en cours :",
      steps: [
        "Définir qui lit / modifie quelles réalisations selon le rôle",
        "Tester avec « voir comme » (admin, responsable, freelance)",
        "Sécuriser la déclaration CRA déjà ouverte, avant relecture et qualification",
      ],
    },
  },
  {
    id: "equipe-liste",
    themeId: "equipe",
    title: "Consulter l’équipe",
    summary:
      "Lister les personnes du pilotage et ouvrir une fiche (carte d’identité), en lecture seule.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/53",
    guide: {
      lead: "L’annuaire de l’équipe évite d’ouvrir la table brute : on voit qui est là, dans quel département, avec quel rôle.",
      stepsIntro: "Dans le widget, vous pouvez :",
      steps: [
        "Ouvrir le menu Équipe",
        "Filtrer (par défaut les personnes actives) et rechercher",
        "Ouvrir une fiche : nom, département, portage, statut, spécialité, rôle",
      ],
      pagePath: "/equipe",
      pageLinkLabel: "Ouvrir Équipe",
    },
  },
  {
    id: "equipe-droits-ecran",
    themeId: "equipe",
    title: "Qui voit l’écran Équipe",
    summary:
      "Les Admin règlent, rôle par rôle, si le menu Équipe (et les autres écrans) restent visibles.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/54",
    guide: {
      lead: "Plus besoin d’ouvrir une table Grist obscure : une page Admin regroupe les cases par thèmes (Budget, Équipe…).",
      stepsIntro: "Pour un Admin :",
      steps: [
        "Ouvrir Outils → Droits des pages",
        "Cocher ou décocher Équipe (et les autres écrans) pour chaque rôle",
        "Enregistrer : le menu suit ; les montants et l’e-mail restent hors de l’annuaire",
      ],
      pagePath: "/outils/droits-pages",
      pageLinkLabel: "Ouvrir Droits des pages",
    },
  },
  {
    id: "equipe-acces-grist",
    themeId: "equipe",
    title: "Table Équipe et accès Grist",
    summary:
      "Nettoyer la table des personnes et protéger les données selon les rôles, côté Grist.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/55",
    guide: {
      lead: "La table Équipe sert d’annuaire et de base pour les droits. Les Freelances ne voient que nom, département et spécialité ; e-mail et TJM restent protégés.",
      stepsIntro: "Vous pouvez :",
      steps: [
        "Ouvrir l’annuaire Équipe dans le widget",
        "En « Voir comme » Freelance : seulement trois colonnes dans Grist et dans le widget",
        "Constater que e-mail et TJM restent masqués hors Owner/Admin",
      ],
      pagePath: "/equipe",
      pageLinkLabel: "Ouvrir Équipe",
    },
  },
  {
    id: "equipe-fiche-ux",
    themeId: "equipe",
    title: "Fiche personne plus claire",
    summary:
      "Améliorer la lecture de la fiche d’une personne (identité, statut, rôle, portage), toujours en consultation.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/59",
    guide: {
      lead: "La fiche personne se lit d’un coup d’œil : badges (statut, rôle, portage) et bandeau (département, spécialité).",
      stepsIntro: "Dans le widget, vous pouvez :",
      steps: [
        "Ouvrir une fiche depuis la liste Équipe",
        "Voir l’identité mise en avant, avec statut, rôle et portage en badges",
        "Lire département et spécialité dans le bandeau ; missions en cours en texte si renseignées",
      ],
      pagePath: "/equipe",
      pageLinkLabel: "Ouvrir Équipe",
    },
  },
  {
    id: "equipe-tjm-soi",
    themeId: "equipe",
    title: "Voir son TJM, pas celui des collègues",
    summary:
      "Un freelance peut consulter son tarif journalier (et Total TTC) sur sa fiche ; les autres freelances ne les voient pas.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/60",
    guide: {
      lead: "Le TJM est sensible : on le protège pour les collègues, tout en permettant à chacun de retrouver le sien sur sa propre fiche.",
      stepsIntro: "Avec les droits du document :",
      steps: [
        "Sur ma fiche : mon TJM et mon Total TTC sont lisibles",
        "Sur la fiche d’un collègue : pas de montants",
        "Un Admin / Owner continue de voir l’ensemble des fiches",
      ],
      pagePath: "/equipe",
      pageLinkLabel: "Ouvrir Équipe",
    },
  },
  {
    id: "equipe-fiche-droits",
    themeId: "equipe",
    title: "La fiche affiche seulement ce qui est autorisé",
    summary:
      "Le widget suit les droits réels : TJM et Total TTC apparaissent sur la fiche s’ils sont autorisés ; sinon masqués.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/61",
    guide: {
      lead: "L’écran ne contourne pas les règles : il montre ce que le document autorise déjà, rien de plus.",
      stepsIntro: "Dans le widget, vous pouvez :",
      steps: [
        "Ouvrir une fiche : TJM et Total TTC seulement s’ils sont lisibles",
        "Constater qu’ils restent absents sur une fiche collègue (après réglage des droits)",
        "Garder la consultation seule pour cette étape",
      ],
      pagePath: "/equipe",
      pageLinkLabel: "Ouvrir Équipe",
    },
  },
  {
    id: "equipe-fiche-missions",
    themeId: "equipe",
    title: "Missions rattachées sur la fiche personne",
    summary:
      "Lister les prestations / missions liées à une personne et ouvrir la fiche mission depuis Équipe.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/62",
    guide: {
      lead: "Une fiche personne complète relie l’annuaire au pilotage des missions, sans remplacer l’écran Missions.",
      stepsIntro: "Sur la fiche, vous pouvez :",
      steps: [
        "Voir la section Missions & prestations",
        "Filtrer En cours ou Toutes",
        "Ouvrir une mission liée en un clic",
      ],
      pagePath: "/equipe",
      pageLinkLabel: "Ouvrir Équipe",
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
      "Saisie livrée : jours et description sur vos prestations ; relecture manager et qualification à venir.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/33",
    guide: {
      lead: "En fin de mois, l’intervenant déclare déjà son activité sur ses prestations en cours. Une relecture manager et des droits Grist plus stricts suivront.",
      stepsIntro: "Vous pouvez :",
      steps: [
        "Ouvrir Mon carnet et choisir le mois",
        "Renseigner les jours et une description sur vos prestations en cours",
        "Enregistrer (création ou mise à jour de vos lignes)",
      ],
      pagePath: "/cra/declarer",
      pageLinkLabel: "Ouvrir Mon carnet",
    },
  },
  {
    id: "cra-qualifier",
    themeId: "cra",
    title: "Qualifier un CRA et le lier au bon de commande",
    summary:
      "Revue manager par département : ajuster jours / description et rattacher chaque CRA au bon de commande.",
    status: "done",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/70",
    guide: {
      lead: "Le manager d’un département passe en revue les CRA de son équipe et rattache chaque ligne au bon de commande pour le suivi budget.",
      stepsIntro: "Sur la page Revue CRA équipe, vous pouvez :",
      steps: [
        "Choisir le mois et un freelance de votre département",
        "Ajuster les jours ou la description si besoin",
        "Choisir le bon de commande et enregistrer",
      ],
      pagePath: "/cra/revue-equipe",
      pageLinkLabel: "Ouvrir Revue CRA équipe",
    },
  },
  {
    id: "equipe-fiche-edition-admin",
    themeId: "equipe",
    title: "Éditer une fiche Équipe (Admin)",
    summary:
      "Permettre aux Admin de corriger certains champs d’une personne depuis le widget, sans passer par la table.",
    status: "later",
    issueUrl:
      "https://github.com/DNUM-SocialGouv/pilotage_studios_grist/issues/63",
    guide: {
      lead: "Corriger un département, un portage ou un statut ne devrait pas obliger à ouvrir la table brute.",
      stepsIntro: "Quand ce parcours sera livré, un Admin pourra :",
      steps: [
        "Ouvrir une fiche et modifier des champs non sensibles (liste à trancher)",
        "Enregistrer : la liste et la fiche se mettent à jour",
        "Les freelances restent en consultation seule pour cette vague",
      ],
      pagePath: "/equipe",
      pageLinkLabel: "Ouvrir Équipe",
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

/** Regroupe les items en colonnes Backlog → En cours → Livré.
 * Livré : ordre antéchronologique (dernier traité en haut = reverse de l’ordre source).
 * Convention : un nouvel item `done` doit être placé **après** les autres `done`
 * dans `PUBLIC_ROADMAP_ITEMS`, sinon il n’apparaîtra pas en tête de Livré.
 */
export function groupPublicRoadmapByKanban(
  items: PublicRoadmapItem[] = PUBLIC_ROADMAP_ITEMS,
): PublicRoadmapKanbanGroup[] {
  return ROADMAP_KANBAN_COLUMNS.map((column) => {
    const columnItems = items.filter(
      (item) => roadmapStatusToKanbanColumn(item.status) === column.id,
    );
    return {
      column,
      items: column.id === "livre" ? [...columnItems].reverse() : columnItems,
    };
  });
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
