import type { MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import type { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import { useAclProfil } from "../AclProfilContext";
import { canAccessHref } from "../security/pageAccess";
import { isAdminRole, isCraDeclarerRole } from "../utils/droitsPagesThemes";
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
  const { status, flags, error, role } = useAclProfil();

  // Pendant le chargement : nav complète hors liens adminOnly / craDeclarerOnly (évite flash).
  // Après résolution : filtre selon `Page_*` (fail-closed si empty/error) + rôles.
  const isAdmin = status === "standalone" || isAdminRole(role);
  const canDeclareCra = status === "standalone" || isCraDeclarerRole(role);
  const navTree =
    status === "loading"
      ? filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, () => true, {
          isAdmin: false,
          canDeclareCra: false,
        })
      : filterNavItemsByPageAccess(
          WIDGET_NAV_ITEMS,
          (href) => canAccessHref(href, flags),
          { isAdmin, canDeclareCra },
        );

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
              ? `Impossible de créer ou lire votre fiche d’accès (Acl_profil)${error ? ` — ${error}` : ""}. Les menus budget restent masqués. Si vous êtes en « Voir comme » (lecture seule), la création auto est bloquée : reconnectez-vous avec le vrai compte, ou demandez à un Admin d’ajouter la fiche.`
              : `Impossible de lire vos droits d’écrans${error ? ` (${error})` : ""}. Les menus budget restent masqués. Réessayez ou contactez un administrateur.`
          }
        />
      ) : null}
    </div>
  );
}
