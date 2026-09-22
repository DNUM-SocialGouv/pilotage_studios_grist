import type { ReactNode, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";

export type WidgetBreadcrumbSegment = {
  label: string;
  to: string;
};

export type WidgetBreadcrumbProps = {
  /** Segments cliquables après Accueil (ex. Produits → /produits). */
  segments: WidgetBreadcrumbSegment[];
  /** Libellé de la page courante (non cliquable). */
  currentPageLabel: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Fil d’Ariane DSFR branché sur MemoryRouter (pas de BrowserRouter).
 * Accueil est toujours le premier cran.
 */
export function WidgetBreadcrumb({
  segments,
  currentPageLabel,
  className,
  id,
}: WidgetBreadcrumbProps) {
  const navigate = useNavigate();

  const linkProps = (to: string) => ({
    href: to,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      navigate(to);
    },
  });

  return (
    <Breadcrumb
      id={id}
      className={className}
      homeLinkProps={linkProps("/")}
      segments={segments.map((s) => ({
        label: s.label,
        linkProps: linkProps(s.to),
      }))}
      currentPageLabel={currentPageLabel}
    />
  );
}
