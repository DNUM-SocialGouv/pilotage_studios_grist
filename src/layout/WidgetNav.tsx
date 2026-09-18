import type { MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import type { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { useAclProfil } from "../AclProfilContext";
import { canAccessHref } from "../security/pageAccess";
import {
  WIDGET_NAV_ITEMS,
  filterNavItemsByPageAccess,
  isGroupActive,
  isNavActive,
  isWidgetNavGroup,
  type WidgetNavLink,
} from "./widgetNavItems";

export type {
  WidgetNavGroup,
  WidgetNavItem,
  WidgetNavLink,
  WidgetNavStatus,
} from "./widgetNavItems";
export {
  WIDGET_MODULE_LINKS,
  WIDGET_NAV_ITEMS,
  WIDGET_NAV_LINKS,
} from "./widgetNavItems";

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
  const { status, flags, error } = useAclProfil();

  // Pendant le chargement : nav complète (évite flash Admin Budget → masqué → réouvert).
  // Après résolution : filtre selon `Page_*` (fail-closed si empty/error).
  const navTree =
    status === "loading"
      ? WIDGET_NAV_ITEMS
      : filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, (href) => canAccessHref(href, flags));

  const onNavClick = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };

  const items: MainNavigationProps.Item[] = navTree.map((item) => {
    if (isWidgetNavGroup(item)) {
      return {
        text: item.text,
        isActive: isGroupActive(pathname, item),
        menuLinks: item.children.map((child) => ({
          text: child.text,
          isActive: isNavActive(pathname, child.href),
          linkProps: {
            href: child.href,
            onClick: onNavClick(child.href),
          },
        })),
      };
    }

    return {
      text: navItemText(item),
      isActive: isNavActive(pathname, item.href),
      linkProps: {
        href: item.href,
        title: item.iconOnly ? item.text : undefined,
        onClick: onNavClick(item.href),
      },
    };
  });

  const showProfilIssue = status === "error" || status === "empty";

  return (
    <div className="widget-nav fr-mb-2w">
      <MainNavigation items={items} />
      {showProfilIssue ? (
        <Alert
          className="fr-mt-2w"
          severity="warning"
          small
          title={
            status === "empty"
              ? "Profil d’accès introuvable"
              : "Profil d’accès indisponible"
          }
          description={
            status === "empty"
              ? "Aucune fiche Acl_profil pour votre compte : les menus budget restent masqués (fail-closed). Contactez un administrateur Pilotage."
              : `Impossible de lire vos droits d’écrans${error ? ` (${error})` : ""}. Les menus budget restent masqués. Réessayez ou contactez un administrateur.`
          }
        />
      ) : null}
    </div>
  );
}
