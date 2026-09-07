/** Statut d’un écran pour la welcome page (et doc). */
export type WidgetNavStatus = "in_progress" | "coming";

export type WidgetNavLink = {
  text: string;
  href: string;
  /** Absent pour Accueil (pas listé comme module métier). */
  status?: WidgetNavStatus;
  /** Lien icône seule (libellé via `text` en `fr-sr-only`). */
  iconOnly?: "home";
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
      { text: "Prestation / CRA", href: "/cra", status: "coming" },
      { text: "Procès-verbaux", href: "/pv", status: "coming" },
    ],
  },
  { text: "Produits", href: "/produits", status: "coming" },
  { text: "Missions", href: "/missions", status: "coming" },
  { text: "Intervenants", href: "/intervenants", status: "coming" },
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
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isGroupActive(pathname: string, group: WidgetNavGroup): boolean {
  return group.children.some((child) => isNavActive(pathname, child.href));
}
