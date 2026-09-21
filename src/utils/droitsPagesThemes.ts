/**
 * Thématiques UI pour la page Admin « Droits des pages ».
 * Clés = colonnes `Page_*` de `Droits_pages` / `Acl_profil`.
 */

import type { PageAccessKey } from "../security/pageAccess";

export type DroitsPagesThemeId =
  | "budget"
  | "outils"
  | "missions"
  | "equipe"
  | "a_venir"
  | "accueil";

export type DroitsPagesScreen = {
  key: PageAccessKey;
  label: string;
  /** Accueil : affiché mais non modifiable. */
  readOnly?: boolean;
};

export type DroitsPagesTheme = {
  id: DroitsPagesThemeId;
  label: string;
  screens: DroitsPagesScreen[];
};

/** Ordre d’affichage (plan #54). */
export const DROITS_PAGES_THEMES: readonly DroitsPagesTheme[] = [
  {
    id: "budget",
    label: "Budget",
    screens: [
      { key: "Page_bdc", label: "Bons de commande" },
      { key: "Page_pa", label: "Plans d’activité" },
      { key: "Page_cra", label: "Prestation / CRA" },
      { key: "Page_pv", label: "Procès-verbaux" },
    ],
  },
  {
    id: "outils",
    label: "Outils",
    screens: [{ key: "Page_recap_porteurs", label: "Récap porteurs" }],
  },
  {
    id: "missions",
    label: "Missions",
    screens: [{ key: "Page_missions", label: "Missions" }],
  },
  {
    id: "equipe",
    label: "Équipe",
    screens: [{ key: "Page_equipe", label: "Équipe" }],
  },
  {
    id: "a_venir",
    label: "À venir",
    screens: [{ key: "Page_produits", label: "Produits" }],
  },
  {
    id: "accueil",
    label: "Accueil",
    screens: [{ key: "Page_accueil", label: "Accueil", readOnly: true }],
  },
] as const;

/** Libellés courts des rôles (colonnes de la grille). */
export const DROITS_PAGES_ROLE_ORDER = [
  "Admin",
  "Responsable de département",
  "Freelance",
  "Invité",
] as const;

export type DroitsPagesRoleName = (typeof DROITS_PAGES_ROLE_ORDER)[number];

export const DROITS_PAGES_ROLE_SHORT: Record<DroitsPagesRoleName, string> = {
  Admin: "Admin",
  "Responsable de département": "Resp.",
  Freelance: "Freelance",
  Invité: "Invité",
};

export function isAdminRole(role: string | null | undefined): boolean {
  return (role?.trim() ?? "") === "Admin";
}

/** Rôles autorisés à ouvrir « Mon carnet » / déclaration CRA (couche 5, hors Page_*). */
export function isCraDeclarerRole(role: string | null | undefined): boolean {
  const t = role?.trim() ?? "";
  return t === "Admin" || t === "Freelance";
}

/**
 * Rôles autorisés à ouvrir « Revue CRA équipe » (couche 5, hors Page_*).
 * Le département (`Equipe.Equipe`) est contrôlé dans la page.
 */
export function isCraRevueEquipeRole(role: string | null | undefined): boolean {
  const t = role?.trim() ?? "";
  return t === "Admin" || t === "Responsable de département";
}

/** Clés éditables (tout sauf Accueil). */
export function editablePageAccessKeys(): PageAccessKey[] {
  return DROITS_PAGES_THEMES.flatMap((theme) =>
    theme.screens.filter((s) => !s.readOnly).map((s) => s.key),
  );
}
