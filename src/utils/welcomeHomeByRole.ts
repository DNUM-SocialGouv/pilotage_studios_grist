/**
 * Contenu d’accueil par rôle (PR-A) — mapping pur, sans fetch.
 * Les CTA respectent les mêmes règles que la nav (Page_* + flags rôle).
 */

import type { PageAccessFlags } from "../security/pageAccess.ts";
import {
  isAdminRole,
  isCraDeclarerRole,
  isCraRevueEquipeRole,
} from "./droitsPagesThemes.ts";

export type WelcomeCtaId =
  | "mon_carnet"
  | "missions"
  | "regles_metier"
  | "revue_cra"
  | "bdc"
  | "droits_pages"
  | "produits"
  | "feuille_de_route";

export type WelcomeCta = {
  id: WelcomeCtaId;
  label: string;
  href: string;
  description: string;
};

export type WelcomeRoleKind =
  | "freelance"
  | "responsable"
  | "admin"
  | "invite"
  | "unknown";

export type WelcomeHomeContent = {
  kind: WelcomeRoleKind;
  /** Titre principal (ex. « Bonjour » / « Bonjour Nathalie »). */
  title: string;
  roleLabel: string | null;
  /** Sous-titre d’intro ; `null` = ne pas afficher (accueil Freelance / Admin épuré). */
  lead: string | null;
  /** Bloc « À savoir » ; `null` = ne pas afficher (Admin épuré). */
  hint: string | null;
  /**
   * Affiche le libellé produit « Pilotage studios » au-dessus du titre.
   * Désactivé pour Freelance / Admin (demande porteur).
   */
  showProductLabel?: boolean;
  ctas: WelcomeCta[];
};

export type WelcomeHomeAccess = {
  flags: PageAccessFlags;
  /** Freelance / Admin / Resp. — même règle que Mon carnet. */
  canDeclareCra: boolean;
  /** Admin / Resp. + département renseigné — même règle que la nav Revue. */
  canRevueCraEquipe: boolean;
  isAdmin: boolean;
  /**
   * Lien Feuille de route (`/feuille-de-route`) — CTA Admin vers la page dédiée.
   */
  includeFeuilleDeRoute?: boolean;
};

const CTA_CATALOG: Record<WelcomeCtaId, WelcomeCta> = {
  mon_carnet: {
    id: "mon_carnet",
    label: "Mon carnet",
    href: "/cra/declarer",
    description: "Saisir ou consulter les jours du mois",
  },
  missions: {
    id: "missions",
    label: "Missions",
    href: "/missions",
    description: "Voir les missions et prestations",
  },
  regles_metier: {
    id: "regles_metier",
    label: "Documentation",
    href: "/outils/regles-metier",
    description: "Guide court des règles de base",
  },
  revue_cra: {
    id: "revue_cra",
    label: "Revue CRA équipe",
    href: "/cra/revue-equipe",
    description: "Relire les jours de votre département",
  },
  bdc: {
    id: "bdc",
    label: "Bons de commande",
    href: "/bdc",
    description: "Entrée Budget — bons de commande",
  },
  droits_pages: {
    id: "droits_pages",
    label: "Droits des pages",
    href: "/outils/droits-pages",
    description: "Interrupteurs d’écrans par rôle",
  },
  produits: {
    id: "produits",
    label: "Produits",
    href: "/produits",
    description: "Consulter le catalogue produits",
  },
  feuille_de_route: {
    id: "feuille_de_route",
    label: "Feuille de route",
    href: "/feuille-de-route",
    description: "Kanban Feedback · Backlog · En cours · Livré",
  },
};

/** Ordre des CTA candidats par rôle (avant filtre d’accès). */
const ROLE_CTA_IDS: Record<Exclude<WelcomeRoleKind, "unknown">, WelcomeCtaId[]> = {
  freelance: ["mon_carnet", "missions", "regles_metier"],
  responsable: ["revue_cra", "mon_carnet", "missions"],
  admin: ["missions", "bdc", "droits_pages", "feuille_de_route"],
  invite: ["missions", "produits", "regles_metier"],
};

export function welcomeRoleKind(
  role: string | null | undefined,
): WelcomeRoleKind {
  const t = role?.trim() ?? "";
  if (t === "Admin") {
    return "admin";
  }
  if (t === "Responsable de département") {
    return "responsable";
  }
  if (t === "Freelance") {
    return "freelance";
  }
  if (t === "Invité") {
    return "invite";
  }
  return "unknown";
}

function canShowCta(id: WelcomeCtaId, access: WelcomeHomeAccess): boolean {
  switch (id) {
    case "mon_carnet":
      return access.canDeclareCra;
    case "missions":
      return access.flags.Page_missions;
    case "regles_metier":
      return access.flags.Page_regles_metier;
    case "revue_cra":
      return access.canRevueCraEquipe;
    case "bdc":
      return access.flags.Page_bdc;
    case "droits_pages":
      return access.isAdmin;
    case "produits":
      return access.flags.Page_produits;
    case "feuille_de_route":
      return access.includeFeuilleDeRoute === true;
  }
}

function filterCtas(
  ids: readonly WelcomeCtaId[],
  access: WelcomeHomeAccess,
): WelcomeCta[] {
  return ids
    .filter((id) => canShowCta(id, access))
    .map((id) => CTA_CATALOG[id]);
}

export type BuildWelcomeHomeParams = {
  role: string | null | undefined;
  /** Statut profil session (`ok` | `empty` | `error` | `standalone` | `loading`). */
  status: string;
  equipeLabel?: string | null;
  /**
   * `Equipe.Prenom_Nom` de la personne connectée (même source que le menu compte).
   * Sert au titre « Bonjour [Prénom] » (Freelance / Admin) — pas de clé API.
   */
  displayName?: string | null;
  access: WelcomeHomeAccess;
};

/**
 * Extrait le prénom depuis `Equipe.Prenom_Nom`.
 * - « Nathalie Molines » → Nathalie
 * - « MOLINES Nathalie » (NOM Prénom) → Nathalie
 * - vide / absent → null (titre = « Bonjour » seul)
 */
export function firstNameFromDisplayName(
  displayName: string | null | undefined,
): string | null {
  const parts = (displayName?.trim() ?? "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return null;
  }
  if (parts.length === 1) {
    return parts[0]!;
  }
  const first = parts[0]!;
  const looksLikeNomFirst =
    first === first.toLocaleUpperCase("fr-FR") && /[A-Za-zÀ-ÿ]/.test(first);
  return looksLikeNomFirst ? parts[parts.length - 1]! : first;
}

/** Titre d’accueil (Freelance / Admin) : « Bonjour Nathalie » ou « Bonjour » si prénom absent. */
export function welcomeGreetingTitle(
  displayName: string | null | undefined,
): string {
  const prenom = firstNameFromDisplayName(displayName);
  return prenom ? `Bonjour ${prenom}` : "Bonjour";
}

/**
 * Construit le contenu d’accueil selon le rôle.
 * `standalone` (preview locale) → variante Admin ouverte.
 */
export function buildWelcomeHome(
  params: BuildWelcomeHomeParams,
): WelcomeHomeContent {
  const { status, equipeLabel, access, displayName } = params;
  const role =
    status === "standalone" && !params.role?.trim()
      ? "Admin"
      : params.role;
  const kind =
    status === "standalone" && !params.role?.trim()
      ? ("admin" as const)
      : welcomeRoleKind(role);

  if (kind === "unknown" || status === "empty" || status === "error") {
    return {
      kind: "unknown",
      title: "Bonjour",
      roleLabel: role?.trim() || null,
      lead:
        status === "error"
          ? "Votre profil d’accès n’a pas pu être chargé. Utilisez la navigation ou le guide si disponible."
          : status === "empty"
            ? "Aucune fiche de profil n’est associée à votre compte pour l’instant."
            : "Nous n’avons pas reconnu votre rôle. Utilisez la navigation ou le guide si disponible.",
      hint: null,
      ctas: filterCtas(["regles_metier", "missions"], access),
    };
  }

  if (kind === "freelance") {
    return {
      kind,
      title: welcomeGreetingTitle(displayName),
      roleLabel: null,
      lead: null,
      hint: "Pensez à déclarer les jours du mois.",
      showProductLabel: false,
      ctas: filterCtas(ROLE_CTA_IDS.freelance, access),
    };
  }

  if (kind === "responsable") {
    const dept = equipeLabel?.trim() || null;
    return {
      kind,
      title: "Bonjour",
      roleLabel: "Responsable de département",
      lead: "Suivre l’équipe et le carnet — revue des jours, puis missions.",
      hint: dept
        ? `Département : ${dept}. Weekly n’apparaît que si votre e-mail est listé parmi les coachs.`
        : "Renseignez votre département dans Équipe pour ouvrir la revue CRA. Weekly n’apparaît que si votre e-mail est listé parmi les coachs.",
      ctas: filterCtas(ROLE_CTA_IDS.responsable, access),
    };
  }

  if (kind === "admin") {
    return {
      kind,
      title: welcomeGreetingTitle(displayName),
      roleLabel: null,
      lead: null,
      hint: null,
      showProductLabel: false,
      ctas: filterCtas(ROLE_CTA_IDS.admin, access),
    };
  }

  // invite
  return {
    kind: "invite",
    title: "Bonjour",
    roleLabel: "Invité",
    lead: "Consultation — parcourez les écrans ouverts sans saisie de carnet ni revue.",
    hint: "Pas de Mon carnet, ni de revue CRA, ni de droits des pages pour ce rôle.",
    ctas: filterCtas(ROLE_CTA_IDS.invite, access),
  };
}

/** Dérive les flags d’accès à partir du rôle + drapeaux Page_* (même logique que WidgetNav). */
export function welcomeAccessFromSession(params: {
  role: string | null | undefined;
  status: string;
  flags: PageAccessFlags;
  equipeLabel?: string | null;
  includeFeuilleDeRoute?: boolean;
}): WelcomeHomeAccess {
  const { role, status, flags, equipeLabel, includeFeuilleDeRoute } = params;
  const isAdmin = status === "standalone" || isAdminRole(role);
  const canDeclareCra = status === "standalone" || isCraDeclarerRole(role);
  const canRevueCraEquipe =
    status === "standalone" ||
    (isCraRevueEquipeRole(role) && Boolean(equipeLabel?.trim()));
  return {
    flags,
    canDeclareCra,
    canRevueCraEquipe,
    isAdmin,
    includeFeuilleDeRoute: includeFeuilleDeRoute === true,
  };
}
