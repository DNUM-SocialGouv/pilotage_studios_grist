import type { MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import type { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";

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

/** Liens de navigation du widget (sous-ensemble métier + Accueil). */
export const WIDGET_NAV_LINKS: WidgetNavLink[] = [
  { text: "Accueil", href: "/", iconOnly: "home" },
  { text: "BDC", href: "/bdc", status: "in_progress" },
  { text: "PA", href: "/pa", status: "in_progress" },
  { text: "Produits", href: "/produits", status: "coming" },
  { text: "Missions", href: "/missions", status: "coming" },
  { text: "Intervenants", href: "/intervenants", status: "coming" },
  { text: "CRA", href: "/cra", status: "coming" },
  { text: "PV", href: "/pv", status: "coming" },
];

/** Modules métier listés sur la welcome (hors Accueil). */
export const WIDGET_MODULE_LINKS = WIDGET_NAV_LINKS.filter(
  (link): link is WidgetNavLink & { status: WidgetNavStatus } => link.status != null,
);

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navItemText(link: WidgetNavLink): ReactNode {
  if (link.iconOnly === "home") {
    return (
      <>
        <span className="fr-icon-home-4-line" aria-hidden="true" />
        <span className="fr-sr-only">{link.text}</span>
      </>
    );
  }
  return link.text;
}

export function WidgetNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items: MainNavigationProps.Item[] = WIDGET_NAV_LINKS.map((link) => ({
    text: navItemText(link),
    isActive: isNavActive(pathname, link.href),
    linkProps: {
      href: link.href,
      title: link.iconOnly ? link.text : undefined,
      onClick: (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigate(link.href);
      },
    },
  }));

  return (
    <div className="widget-nav fr-mb-2w">
      <MainNavigation items={items} />
    </div>
  );
}
