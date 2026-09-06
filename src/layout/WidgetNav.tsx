import type { MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import type { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";

/** Aligné sur NAV_LINKS de pilotage_studios (Header), sans brand Marianne. */
export const WIDGET_NAV_LINKS: { text: string; href: string }[] = [
  { text: "BDC", href: "/bdc" },
  { text: "PA", href: "/pa" },
  { text: "Produits", href: "/produits" },
  { text: "Missions", href: "/missions" },
  { text: "Intervenants", href: "/intervenants" },
  { text: "CRA", href: "/cra" },
  { text: "PV", href: "/pv" },
  { text: "Évaluations", href: "/evaluations" },
  { text: "Analyse", href: "/analyse" },
];

function isNavActive(pathname: string, href: string): boolean {
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
