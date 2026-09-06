import type { MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import type { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";

/** Statut d’un écran pour la welcome page (et doc). */
export type WidgetNavStatus = "available" | "coming" | "out_of_scope";

export type WidgetNavLink = {
  text: string;
  href: string;
  /** Absent pour Accueil (pas listé comme module métier). */
  status?: WidgetNavStatus;
};

/** Aligné sur NAV_LINKS de pilotage_studios (Header), sans brand Marianne. */
export const WIDGET_NAV_LINKS: WidgetNavLink[] = [
  { text: "Accueil", href: "/" },
  { text: "BDC", href: "/bdc", status: "available" },
  { text: "PA", href: "/pa", status: "available" },
  { text: "Produits", href: "/produits", status: "coming" },
  { text: "Missions", href: "/missions", status: "coming" },
  { text: "Intervenants", href: "/intervenants", status: "coming" },
  { text: "CRA", href: "/cra", status: "coming" },
  { text: "PV", href: "/pv", status: "coming" },
  { text: "Évaluations", href: "/evaluations", status: "coming" },
  { text: "Analyse", href: "/analyse", status: "out_of_scope" },
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

export function WidgetNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items: MainNavigationProps.Item[] = WIDGET_NAV_LINKS.map(({ text, href }) => ({
    text,
    isActive: isNavActive(pathname, href),
    linkProps: {
      href,
      onClick: (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigate(href);
      },
    },
  }));

  return (
    <div className="widget-nav fr-mb-2w">
      <MainNavigation items={items} />
    </div>
  );
}
