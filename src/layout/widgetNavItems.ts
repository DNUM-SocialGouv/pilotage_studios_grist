/** Statut d’un écran pour la welcome page (et doc). */
export type WidgetNavStatus = "in_progress" | "coming";

export type WidgetNavLink = {
  text: string;
  href: string;
  /** Absent pour Accueil (pas listé comme module métier). */
  status?: WidgetNavStatus;
  /** Lien icône seule (libellé via `text` en `fr-sr-only`). */
  iconOnly?: "home";
  /** Visible seulement si rôle Admin (indépendant des `Page_*`). */
  adminOnly?: boolean;
  /**
   * Visible seulement si rôle Freelance ou Admin (déclaration CRA).
   * Indépendant des `Page_*` — ne passe pas par `canAccess`.
   */
  craDeclarerOnly?: boolean;
};

export type WidgetNavGroup = {
  text: string;
  children: WidgetNavLink[];
};

export type WidgetNavItem = WidgetNavLink | WidgetNavGroup;

export function isWidgetNavGroup(item: WidgetNavItem): item is WidgetNavGroup {
  return "children" in item;
}

/** Arborescence de navigation (liens directs + groupes DSFR). */
export const WIDGET_NAV_ITEMS: WidgetNavItem[] = [
  { text: "Accueil", href: "/", iconOnly: "home" },
  {
    text: "Budget",
    children: [
      { text: "Bons de commande", href: "/bdc", status: "in_progress" },
      { text: "Plans d’activité", href: "/pa", status: "in_progress" },
      { text: "Prestation / CRA", href: "/cra", status: "in_progress" },
      {
        text: "Déclarer mon CRA",
        href: "/cra/declarer",
        status: "in_progress",
        craDeclarerOnly: true,
      },
      { text: "Procès-verbaux", href: "/pv", status: "coming" },
    ],
  },
  { text: "Produits", href: "/produits", status: "coming" },
  { text: "Missions", href: "/missions", status: "in_progress" },
  { text: "Équipe", href: "/equipe", status: "in_progress" },
  {
    text: "Outils",
    children: [
      { text: "Récap porteurs", href: "/outils/recap-porteurs", status: "in_progress" },
      {
        text: "Droits des pages",
        href: "/outils/droits-pages",
        status: "in_progress",
        adminOnly: true,
      },
    ],
  },
];

export function flattenNavLinks(items: WidgetNavItem[]): WidgetNavLink[] {
  return items.flatMap((item) => (isWidgetNavGroup(item) ? item.children : [item]));
}

/** Liens plats (Accueil + modules), y compris ceux sous un groupe. */
export const WIDGET_NAV_LINKS = flattenNavLinks(WIDGET_NAV_ITEMS);

/** Modules métier listés sur la welcome (hors Accueil). */
export const WIDGET_MODULE_LINKS = WIDGET_NAV_LINKS.filter(
  (link): link is WidgetNavLink & { status: WidgetNavStatus } => link.status != null,
);

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  // Liste Admin CRA : ne pas rester active sur `/cra/declarer`.
  if (href === "/cra") {
    return pathname === "/cra";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isGroupActive(pathname: string, group: WidgetNavGroup): boolean {
  return group.children.some((child) => isNavActive(pathname, child.href));
}

/**
 * Filtre nav selon drapeaux `Page_*` (couche 5).
 * `adminOnly` : lien réservé rôle Admin (indépendant de `Page_*`).
 * `craDeclarerOnly` : lien réservé Freelance / Admin (indépendant de `Page_*`).
 */
export function filterNavItemsByPageAccess(
  items: WidgetNavItem[],
  canAccess: (href: string) => boolean,
  options?: { isAdmin?: boolean; canDeclareCra?: boolean },
): WidgetNavItem[] {
  const isAdmin = options?.isAdmin === true;
  const canDeclareCra = options?.canDeclareCra === true;
  const out: WidgetNavItem[] = [];
  for (const item of items) {
    if (isWidgetNavGroup(item)) {
      const children = item.children.filter((child) => {
        if (child.adminOnly && !isAdmin) {
          return false;
        }
        if (child.craDeclarerOnly) {
          return canDeclareCra;
        }
        return canAccess(child.href);
      });
      if (children.length > 0) {
        out.push({ ...item, children });
      }
      continue;
    }
    if (item.adminOnly && !isAdmin) {
      continue;
    }
    if (item.craDeclarerOnly) {
      if (canDeclareCra) {
        out.push(item);
      }
      continue;
    }
    if (canAccess(item.href)) {
      out.push(item);
    }
  }
  return out;
}
