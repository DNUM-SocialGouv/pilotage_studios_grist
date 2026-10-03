import { Link, useLocation } from "react-router-dom";
import { guideNavNeighbors } from "./guideNav";

/**
 * Liens Précédent / Suivant en bas de chaque page du guide
 * (absents aux extrémités : pas de Précédent sur l’accueil, pas de Suivant sur la dernière).
 */
export function GuidePageNav() {
  const { pathname } = useLocation();
  const { prev, next } = guideNavNeighbors(pathname);

  if (!prev && !next) {
    return null;
  }

  return (
    <nav
      className="regles-metier-page-nav fr-mt-4w"
      aria-label="Navigation entre les pages du guide"
    >
      <ul className="regles-metier-page-nav__list">
        <li className="regles-metier-page-nav__item regles-metier-page-nav__item--prev">
          {prev ? (
            <Link
              className="fr-link fr-link--icon-left fr-icon-arrow-left-s-line"
              to={prev.path}
            >
              Précédent : {prev.label}
            </Link>
          ) : null}
        </li>
        <li className="regles-metier-page-nav__item regles-metier-page-nav__item--next">
          {next ? (
            <Link
              className="fr-link fr-link--icon-right fr-icon-arrow-right-s-line"
              to={next.path}
            >
              Suivant : {next.label}
            </Link>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}
