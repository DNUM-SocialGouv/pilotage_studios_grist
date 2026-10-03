import { NavLink, Outlet, useLocation } from "react-router-dom";
import { WidgetBreadcrumb } from "../../components/WidgetBreadcrumb";
import { GUIDE_BASE, GUIDE_NAV, guideNavIndex } from "./guideNav";

/**
 * Coquille du guide métier : fil d’Ariane + sommaire + contenu.
 * Accessibilité : nav clavier, lien courant `aria-current`, titres hiérarchiques dans les pages.
 */
export function ReglesMetierLayout() {
  const { pathname } = useLocation();
  const currentIndex = guideNavIndex(pathname);
  const current = GUIDE_NAV[currentIndex] ?? GUIDE_NAV[0];
  const onGuideHome = pathname.split("?")[0] === GUIDE_BASE;

  return (
    <>
      <WidgetBreadcrumb
        currentPageLabel={onGuideHome ? "Règles métier" : current.label}
        segments={
          onGuideHome
            ? []
            : [{ label: "Règles métier", to: GUIDE_BASE }]
        }
      />
      <header className="fr-mb-3w">
        <h1 className="fr-h3 fr-mb-1w">Guide des règles métier</h1>
        <p className="fr-text--sm fr-mb-0">
          Comprendre le Pilotage en langage simple — missions, prestations, CRA, budget et
          rôles.
        </p>
      </header>

      <div className="fr-grid-row fr-grid-row--gutters">
        <aside className="fr-col-12 fr-col-md-4 fr-col-lg-3">
          <nav aria-label="Sommaire du guide des règles métier">
            <p className="fr-text--bold fr-mb-1w" id="guide-sommaire-title">
              Sommaire
            </p>
            <ol className="fr-raw-list regles-metier-sommaire" aria-labelledby="guide-sommaire-title">
              {GUIDE_NAV.map((item, index) => (
                <li key={item.path} className="fr-mb-1w">
                  <NavLink
                    to={item.path}
                    end={index === 0}
                    className={({ isActive }) =>
                      isActive
                        ? "fr-link fr-link--icon-left fr-icon-arrow-right-line"
                        : "fr-link"
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="fr-col-12 fr-col-md-8 fr-col-lg-9">
          <Outlet />
        </div>
      </div>
    </>
  );
}
