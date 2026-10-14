/**
 * Textes pré-remplis Opteamis — demande (contexte) et livrables par profil studio.
 * Éditables après sélection dans le formulaire.
 * Jusqu’à 2 profils peuvent être combinés (textes et UO fusionnés).
 */

export type DevisProfilId = "pm" | "ru" | "design" | "access" | "coach" | "seo" | "dev";

/** Nombre max de types de prestation sélectionnables dans le générateur. */
export const DEVIS_PROFIL_MAX_SELECTION = 2;

export type DevisProfilTemplate = {
  id: DevisProfilId;
  label: string;
  /** Libellé court pour la liste (ex. « PM — missions de PM »). */
  optionLabel: string;
  demandeContexte: string;
  livrablesAttendus: string;
  /** UO Lot 4 suggérées (codes) pour ce profil. */
  uoCodesSuggeres: readonly string[];
  /** Valeur Équipe Grist éventuelle à pré-cocher. */
  equipeSuggeree?: string;
};

export type DevisProfilsMerged = {
  demandeContexte: string;
  livrablesAttendus: string;
  uoCodesSuggeres: string[];
  equipesSuggerees: string[];
};

export const DEVIS_PROFIL_TEMPLATES: readonly DevisProfilTemplate[] = [
  {
    id: "pm",
    label: "Product Management",
    optionLabel: "PM — missions de PM",
    equipeSuggeree: "Product",
    uoCodesSuggeres: ["UO L4 - P - 6.1", "UO L4 - P - 7"],
    demandeContexte: `Dans le cadre de l'accompagnement produit du service / produit concerné, nous souhaitons mobiliser une ressource de product management pour :

- piloter la vision produit et prioriser le backlog en lien avec les parties prenantes ;
- animer la collaboration entre métier, design et technique ;
- suivre les indicateurs d'impact et la feuille de route ;
- accompagner l'équipe dans l'amélioration continue du produit numérique.`,
    livrablesAttendus: `- Feuille de route produit actualisée
- Backlog priorisé et user stories cadrées
- Comptes-rendus de rituels produit (revues, ateliers)
- Supports de restitution et d'arbitrage pour les parties prenantes
- Suivi des indicateurs d'impact / métriques produit`,
  },
  {
    id: "ru",
    label: "Recherche utilisateur",
    optionLabel: "RU — missions de RU",
    equipeSuggeree: "RU",
    uoCodesSuggeres: ["UO L4 - P - 4.1", "UO L4 - P - 4.2"],
    demandeContexte: `Dans le cadre de l'accompagnement du produit / service numérique concerné, nous souhaitons mobiliser une ressource de recherche utilisateur pour :

- comprendre les besoins, parcours et frictions des usagers ;
- conduire des entretiens, observations ou tests utilisateurs ;
- synthétiser les enseignements pour éclairer les décisions produit et design ;
- documenter les méthodes et résultats pour capitalisation au sein de l'équipe.`,
    livrablesAttendus: `- Protocole / déroulé de recherche utilisateur
- Guides d'entretien ou scripts de test
- Comptes-rendus et synthèses de recherche
- Cartographie parcours / personas / insights (selon le besoin)
- Recommandations actionnables pour le produit`,
  },
  {
    id: "design",
    label: "Design",
    optionLabel: "Design — missions de Design",
    equipeSuggeree: "Design",
    uoCodesSuggeres: ["UO L4 - P - 4.1", "UO L4 - P - 4.2"],
    demandeContexte: `Dans le cadre de l'accompagnement du produit / service numérique concerné, nous souhaitons mobiliser une ressource de design (UX/UI et/ou design de contenu) pour :

- concevoir ou faire évoluer les parcours et interfaces ;
- produire des maquettes et prototypes alignés DSFR lorsque pertinent ;
- travailler le contenu et l'expérience en lien avec la recherche utilisateur et le métier ;
- accompagner l'équipe jusqu'à la livraison des écrans.`,
    livrablesAttendus: `- Documents Figma (parcours, maquettes, composants)
- Prototypes interactifs si besoin
- Maquettes de design de contenu
- Spécifications / handoff pour l'équipe de développement
- Supports de restitution design`,
  },
  {
    id: "access",
    label: "Accessibilité",
    optionLabel: "Access. — missions d'accessibilité",
    equipeSuggeree: "Access.",
    uoCodesSuggeres: ["UO L4 - P - 12"],
    demandeContexte: `Dans le cadre de la mise en conformité et de l'amélioration de l'accessibilité numérique du produit / service concerné, nous souhaitons mobiliser une ressource accessibilité pour :

- auditer ou accompagner la conformité RGAA ;
- proposer des correctifs et bonnes pratiques aux équipes ;
- sensibiliser et monter en compétence les contributeurs ;
- suivre la déclaration d'accessibilité et le plan d'actions.`,
    livrablesAttendus: `- Rapport d'audit / évaluation RGAA (ou complément)
- Liste priorisée des non-conformités et recommandations
- Accompagnement à la correction (tickets, relecture)
- Supports de sensibilisation / formation courte
- Éléments pour la déclaration d'accessibilité`,
  },
  {
    id: "coach",
    label: "Coaching produit",
    optionLabel: "Coach — missions de coaching",
    equipeSuggeree: "Coach",
    uoCodesSuggeres: ["UO L4 - P - 8"],
    demandeContexte: `Dans le cadre de l'accompagnement de l'équipe ou du porteur de produit, nous souhaitons mobiliser une ressource de coaching produit pour :

- renforcer l'autonomie sur les pratiques produit et agiles ;
- structurer le cadre de travail (rituels, rôles, priorisation) ;
- accompagner les points de friction organisationnels ;
- transmettre des méthodes actionnables adaptées au contexte ministériel.`,
    livrablesAttendus: `- Plan d'accompagnement et objectifs de coaching
- Comptes-rendus de sessions / ateliers
- Outils et canevas mis en place avec l'équipe
- Rapport d'avancement et niveau d'autonomie
- Recommandations de suite`,
  },
  {
    id: "seo",
    label: "SEO",
    optionLabel: "SEO — missions de référencement",
    uoCodesSuggeres: ["UO L4 - P - 12"],
    demandeContexte: `Dans le cadre de l'amélioration de la visibilité et de la trouvabilité du produit / service numérique concerné, nous souhaitons mobiliser une ressource SEO pour :

- auditer le référencement naturel (technique, contenu, popularité) ;
- proposer une stratégie de mots-clés et de contenus alignée sur les besoins des usagers ;
- accompagner la mise en œuvre des bonnes pratiques (balisage, structure, performance) ;
- suivre les indicateurs d'audience organique et prioriser les actions.`,
    livrablesAttendus: `- Audit SEO (technique / contenu) et plan d'actions priorisé
- Recommandations de balisage, structure et contenus
- Lexique / liste de mots-clés et intentions de recherche
- Suivi des indicateurs (positions, trafic organique)
- Supports de restitution pour l'équipe produit / design / technique`,
  },
  {
    id: "dev",
    label: "Développement",
    optionLabel: "Développeur — missions de développement",
    uoCodesSuggeres: ["UO L4 - P - 3.1", "UO L4 - P - 3.2"],
    demandeContexte: `Dans le cadre de la conception et de l'évolution du produit / service numérique concerné, nous souhaitons mobiliser une ressource de développement pour :

- concevoir, développer et faire évoluer le service en amélioration continue ;
- livrer des incréments testés, alignés avec le métier et le design ;
- collaborer avec l'équipe produit (rituels, revue de code, handoff) ;
- documenter les choix techniques et le fonctionnement livré.`,
    livrablesAttendus: `- Code et pull requests sur le dépôt du produit
- Tests automatisés (unitaires / intégration selon le besoin)
- Documentation technique et notes de handoff
- Tickets de suivi (anomalies, évolutions) à jour
- Supports de restitution pour l'équipe produit / design`,
  },
];

export function getDevisProfilTemplate(id: string): DevisProfilTemplate | undefined {
  return DEVIS_PROFIL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Fusionne 1 ou 2 profils : textes concaténés (avec sous-titre si plusieurs),
 * UO et équipes en union sans doublon.
 */
export function mergeDevisProfilTemplates(ids: readonly string[]): DevisProfilsMerged {
  const templates = ids
    .map((id) => getDevisProfilTemplate(id))
    .filter((t): t is DevisProfilTemplate => t != null);

  if (templates.length === 0) {
    return {
      demandeContexte: "",
      livrablesAttendus: "",
      uoCodesSuggeres: [],
      equipesSuggerees: [],
    };
  }

  if (templates.length === 1) {
    const t = templates[0]!;
    return {
      demandeContexte: t.demandeContexte,
      livrablesAttendus: t.livrablesAttendus,
      uoCodesSuggeres: [...t.uoCodesSuggeres],
      equipesSuggerees: t.equipeSuggeree ? [t.equipeSuggeree] : [],
    };
  }

  const demandeContexte = templates
    .map((t) => `**${t.label}**\n\n${t.demandeContexte}`)
    .join("\n\n");
  const livrablesAttendus = templates
    .map((t) => `**${t.label}**\n\n${t.livrablesAttendus}`)
    .join("\n\n");

  const uoSeen = new Set<string>();
  const uoCodesSuggeres: string[] = [];
  for (const t of templates) {
    for (const code of t.uoCodesSuggeres) {
      if (!uoSeen.has(code)) {
        uoSeen.add(code);
        uoCodesSuggeres.push(code);
      }
    }
  }

  const equipeSeen = new Set<string>();
  const equipesSuggerees: string[] = [];
  for (const t of templates) {
    if (t.equipeSuggeree && !equipeSeen.has(t.equipeSuggeree)) {
      equipeSeen.add(t.equipeSuggeree);
      equipesSuggerees.push(t.equipeSuggeree);
    }
  }

  return { demandeContexte, livrablesAttendus, uoCodesSuggeres, equipesSuggerees };
}
