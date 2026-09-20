/**
 * Droits d’écrans widget (couche 5) — confort UX, pas sécurité données.
 * Source : colonnes `Page_*` de `Acl_profil` (formules ← `Droits_pages`).
 */

/** Ids colonnes Grist `Acl_profil` / `Droits_pages`. */
export const PAGE_ACCESS_KEYS = [
  "Page_accueil",
  "Page_bdc",
  "Page_pa",
  "Page_cra",
  "Page_pv",
  "Page_produits",
  "Page_missions",
  "Page_equipe",
  "Page_recap_porteurs",
] as const;

export type PageAccessKey = (typeof PAGE_ACCESS_KEYS)[number];

export type PageAccessFlags = Record<PageAccessKey, boolean>;

/**
 * Si profil absent / erreur : fail-closed sur le budget sensible,
 * ouvert sur les écrans déjà prévus pour non-Admin dans `Droits_pages`.
 */
export const PAGE_ACCESS_FAIL_CLOSED: PageAccessFlags = {
  Page_accueil: true,
  Page_bdc: false,
  Page_pa: false,
  Page_cra: false,
  Page_pv: false,
  Page_produits: true,
  Page_missions: true,
  Page_equipe: true,
  Page_recap_porteurs: false,
};

/** Dev hors iframe : tout visible pour prévisualiser l’UI. */
export const PAGE_ACCESS_ALL_OPEN: PageAccessFlags = {
  Page_accueil: true,
  Page_bdc: true,
  Page_pa: true,
  Page_cra: true,
  Page_pv: true,
  Page_produits: true,
  Page_missions: true,
  Page_equipe: true,
  Page_recap_porteurs: true,
};

/** Route (pathname) → clé `Page_*`. Routes hors map = non filtrées. */
export const ROUTE_PAGE_ACCESS: ReadonlyArray<{ prefix: string; key: PageAccessKey }> = [
  { prefix: "/outils/recap-porteurs", key: "Page_recap_porteurs" },
  { prefix: "/equipe", key: "Page_equipe" },
  { prefix: "/intervenants", key: "Page_equipe" },
  { prefix: "/missions", key: "Page_missions" },
  { prefix: "/produits", key: "Page_produits" },
  { prefix: "/bdc", key: "Page_bdc" },
  { prefix: "/pa", key: "Page_pa" },
  // `/cra/declarer` : hors Page_* (garde rôle Freelance/Admin) — doit précéder `/cra`.
  { prefix: "/cra", key: "Page_cra" },
  { prefix: "/pv", key: "Page_pv" },
  { prefix: "/", key: "Page_accueil" },
];

export function asPageAccessBool(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === "string") {
    const t = value.trim().toLowerCase();
    return t === "true" || t === "1" || t === "oui";
  }
  return false;
}

export function pageAccessFromRecord(
  fields: Record<string, unknown> | null | undefined,
): PageAccessFlags {
  if (!fields) {
    return { ...PAGE_ACCESS_FAIL_CLOSED };
  }
  const flags = { ...PAGE_ACCESS_FAIL_CLOSED };
  for (const key of PAGE_ACCESS_KEYS) {
    if (key in fields) {
      flags[key] = asPageAccessBool(fields[key]);
    }
  }
  return flags;
}

export function pageAccessKeyForPath(pathname: string): PageAccessKey | null {
  const path = pathname.split("?")[0] || "/";
  // Déclaration CRA : pas de drapeau Page_* (voir CraDeclarerRoleGuard).
  if (path === "/cra/declarer" || path.startsWith("/cra/declarer/")) {
    return null;
  }
  for (const { prefix, key } of ROUTE_PAGE_ACCESS) {
    if (prefix === "/") {
      if (path === "/") {
        return key;
      }
      continue;
    }
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return key;
    }
  }
  return null;
}

export function canAccessPath(pathname: string, flags: PageAccessFlags): boolean {
  const key = pageAccessKeyForPath(pathname);
  if (key == null) {
    return true;
  }
  return flags[key];
}

export function canAccessHref(href: string, flags: PageAccessFlags): boolean {
  return canAccessPath(href, flags);
}
