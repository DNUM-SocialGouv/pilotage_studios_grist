/**
 * Recherche d’accueil V1 — helpers purs (Produit + Mission + Personne).
 * Filtrage aligné sur les listes existantes ; pas de route `/recherche`.
 */

import type { EquipeMember, Mission, ProduitSdpc } from "../types.ts";
import {
  equipeDisplayName,
  filterEquipeMembers,
} from "./equipeList.ts";
import {
  libelleProduitMission,
  missionLibelle,
  missionMatchesFilters,
  produitsByIdFromRows,
} from "./missionsList.ts";
import {
  filterProduits,
  produitDepartement,
  produitDisplayName,
} from "./produitsList.ts";
import type { WelcomeRoleKind } from "./welcomeHomeByRole.ts";

export const WELCOME_SEARCH_MIN_CHARS = 2;
export const WELCOME_SEARCH_MAX_PER_GROUP = 6;
export const WELCOME_SEARCH_DEBOUNCE_MS = 250;

export type WelcomeSearchHitKind = "produit" | "mission" | "personne";

export type WelcomeSearchHit = {
  kind: WelcomeSearchHitKind;
  id: number;
  label: string;
  /** Ligne secondaire (département, produit, spécialité…). */
  meta: string;
  href: string;
  /** Statut mission (badge UI) — uniquement `kind === "mission"`. */
  statut?: string;
};

export type WelcomeSearchTargetFlags = {
  produits: boolean;
  missions: boolean;
  equipe: boolean;
};

export type WelcomeSearchGroups = {
  produits: WelcomeSearchHit[];
  missions: WelcomeSearchHit[];
  personnes: WelcomeSearchHit[];
  truncated: {
    produits: boolean;
    missions: boolean;
    personnes: boolean;
  };
  totalShown: number;
  totalMatched: number;
};

export type BuildWelcomeSearchGroupsParams = {
  query: string;
  targets: WelcomeSearchTargetFlags;
  produits: readonly ProduitSdpc[];
  missions: readonly Mission[];
  members: readonly EquipeMember[];
  maxPerGroup?: number;
};

/** Barre visible pour Admin / Resp. / Freelance uniquement (pas Invité / unknown). */
export function shouldShowWelcomeSearch(kind: WelcomeRoleKind): boolean {
  return kind === "admin" || kind === "responsable" || kind === "freelance";
}

/** Au moins une cible d’écran ouverte (`Page_*`). */
export function hasWelcomeSearchTargets(targets: WelcomeSearchTargetFlags): boolean {
  return targets.produits || targets.missions || targets.equipe;
}

export function welcomeSearchOptionId(hit: WelcomeSearchHit): string {
  return `welcome-search-${hit.kind}-${hit.id}`;
}

/** Liste plate pour navigation clavier (ordre Produits → Missions → Personnes). */
export function flattenWelcomeSearchHits(groups: WelcomeSearchGroups): WelcomeSearchHit[] {
  return [...groups.produits, ...groups.missions, ...groups.personnes];
}

function sliceGroup<T>(items: readonly T[], max: number): { rows: T[]; truncated: boolean } {
  if (items.length <= max) {
    return { rows: [...items], truncated: false };
  }
  return { rows: items.slice(0, max), truncated: true };
}

/**
 * Filtre et regroupe les suggestions.
 * Retourne des groupes vides si la requête a moins de 2 caractères.
 */
export function buildWelcomeSearchGroups(
  params: BuildWelcomeSearchGroupsParams,
): WelcomeSearchGroups {
  const max = params.maxPerGroup ?? WELCOME_SEARCH_MAX_PER_GROUP;
  const q = params.query.trim();
  const empty: WelcomeSearchGroups = {
    produits: [],
    missions: [],
    personnes: [],
    truncated: { produits: false, missions: false, personnes: false },
    totalShown: 0,
    totalMatched: 0,
  };

  if (q.length < WELCOME_SEARCH_MIN_CHARS) {
    return empty;
  }

  const produitsById = produitsByIdFromRows([...params.produits]);

  let produitHits: WelcomeSearchHit[] = [];
  if (params.targets.produits) {
    const filtered = filterProduits(
      params.produits,
      {
        search: q,
        departement: "",
        statut: "",
        avecInvestissementStudio: false,
      },
    );
    produitHits = filtered.map((p) => {
      const dept = produitDepartement(p);
      return {
        kind: "produit" as const,
        id: p.id,
        label: produitDisplayName(p),
        meta: [dept, p.Statut_actuel?.trim()].filter(Boolean).join(" · ") || "Produit",
        href: `/produits/${p.id}`,
      };
    });
  }

  let missionHits: WelcomeSearchHit[] = [];
  if (params.targets.missions) {
    const filtered = params.missions.filter((m) =>
      missionMatchesFilters(
        m,
        {
          search: q,
          equipe: "",
          statut: [],
          departement: "",
          produitIds: [],
          intervenantIds: [],
        },
        produitsById,
        [],
      ),
    );
    filtered.sort((a, b) =>
      missionLibelle(a).localeCompare(missionLibelle(b), "fr", { sensitivity: "base" }),
    );
    missionHits = filtered.map((m) => {
      const produit = libelleProduitMission(m, produitsById);
      const statut = m.Statut?.trim() || undefined;
      return {
        kind: "mission" as const,
        id: m.id,
        label: missionLibelle(m),
        meta: produit !== "—" ? produit : "Mission",
        href: `/missions/${m.id}`,
        statut,
      };
    });
  }

  let personneHits: WelcomeSearchHit[] = [];
  if (params.targets.equipe) {
    const filtered = filterEquipeMembers(params.members, {
      search: q,
      statut: "",
      equipe: "",
      portage: "",
      role: "",
    });
    personneHits = filtered.map((member) => ({
      kind: "personne" as const,
      id: member.id,
      label: equipeDisplayName(member),
      meta:
        [member.Equipe?.trim(), member.Specialite?.trim()]
          .filter(Boolean)
          .join(" · ") || "Personne",
      href: `/equipe/${member.id}`,
    }));
  }

  const produitsSlice = sliceGroup(produitHits, max);
  const missionsSlice = sliceGroup(missionHits, max);
  const personnesSlice = sliceGroup(personneHits, max);

  const totalMatched =
    produitHits.length + missionHits.length + personneHits.length;
  const totalShown =
    produitsSlice.rows.length +
    missionsSlice.rows.length +
    personnesSlice.rows.length;

  return {
    produits: produitsSlice.rows,
    missions: missionsSlice.rows,
    personnes: personnesSlice.rows,
    truncated: {
      produits: produitsSlice.truncated,
      missions: missionsSlice.truncated,
      personnes: personnesSlice.truncated,
    },
    totalShown,
    totalMatched,
  };
}

/** Message aria-live selon l’état. */
export function welcomeSearchStatusMessage(params: {
  query: string;
  loading: boolean;
  error: string | null;
  groups: WelcomeSearchGroups;
}): string {
  const q = params.query.trim();
  if (params.error) {
    return params.error;
  }
  if (q.length > 0 && q.length < WELCOME_SEARCH_MIN_CHARS) {
    return "Tapez au moins 2 lettres pour lancer la recherche.";
  }
  if (params.loading && q.length >= WELCOME_SEARCH_MIN_CHARS) {
    return "Chargement des suggestions…";
  }
  if (q.length < WELCOME_SEARCH_MIN_CHARS) {
    return "";
  }
  if (params.groups.totalMatched === 0) {
    return "Aucun produit, mission ou personne ne correspond.";
  }
  return `${params.groups.totalMatched} résultat${
    params.groups.totalMatched > 1 ? "s" : ""
  }`;
}
