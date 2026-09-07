import type { MouseEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";
import type { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
import {
  WIDGET_NAV_ITEMS,
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

  const onNavClick = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };

  const items: MainNavigationProps.Item[] = WIDGET_NAV_ITEMS.map((item) => {
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

  return (
    <div className="widget-nav fr-mb-2w">
      <MainNavigation items={items} />
    </div>
  );
}
