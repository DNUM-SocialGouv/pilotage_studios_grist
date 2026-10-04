import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import type { WelcomeHomeContent } from "../../utils/welcomeHomeByRole";
import {
  hasWelcomeSearchTargets,
  shouldShowWelcomeSearch,
  type WelcomeSearchTargetFlags,
} from "../../utils/welcomeSearch";
import { WelcomeSearchBar } from "./WelcomeSearchBar";

type WelcomeRoleHomeProps = {
  content: WelcomeHomeContent;
  /** Pendant le chargement du profil : message court sans CTA. */
  loading?: boolean;
  /**
   * Cibles recherche selon `Page_*` (Produits / Missions / Équipe).
   * Absentes ou toutes fermées → pas de barre.
   */
  searchTargets?: WelcomeSearchTargetFlags;
};

/**
 * Tableau de bord léger d’accueil (PR-A) : salutation, rôle, CTA filtrés.
 * Pas de KPI ni de liste exhaustive de la nav.
 * Accueil Freelance / Admin / Responsable : pas de libellé produit / rôle / lead
 * (titre « Bonjour [Prénom] »). Admin / Responsable : pas de bloc « À savoir » (`hint` null).
 * Recherche V1 — option A : « Bonjour » + barre dans un bandeau pleine largeur ;
 * CTA hors bandeau en dessous (Admin / Resp. / Freelance ; pas Invité).
 */
export function WelcomeRoleHome({
  content,
  loading,
  searchTargets,
}: WelcomeRoleHomeProps) {
  const navigate = useNavigate();
  const showProductLabel = content.showProductLabel !== false;
  const showSearch =
    !loading &&
    searchTargets != null &&
    shouldShowWelcomeSearch(content.kind) &&
    hasWelcomeSearchTargets(searchTargets);

  const onCtaClick = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };

  if (loading) {
    return (
      <section
        className="welcome-role-home fr-mb-3w"
        aria-labelledby="welcome-role-title"
        aria-busy="true"
      >
        {showProductLabel ? (
          <p className="fr-text--sm fr-hint-text fr-mb-1w">Pilotage studios</p>
        ) : null}
        <h1 id="welcome-role-title" className="fr-h3">
          Bonjour
        </h1>
        <p className="fr-text--sm fr-hint-text fr-mb-0" role="status">
          Chargement de votre profil…
        </p>
      </section>
    );
  }

  const greetingBlock = (
    <>
      {showProductLabel ? (
        <p className="fr-text--sm fr-hint-text fr-mb-1w">Pilotage studios</p>
      ) : null}
      <h1 id="welcome-role-title" className="fr-h3">
        {content.title}
      </h1>
      {content.roleLabel ? (
        <p className="fr-text--sm fr-mb-1w">
          <span className="fr-sr-only">Rôle : </span>
          <span className="welcome-role-home__role">{content.roleLabel}</span>
        </p>
      ) : null}
      {content.lead?.trim() ? (
        <p className={showSearch ? "fr-mb-2w" : "fr-mb-3w"}>{content.lead}</p>
      ) : null}
    </>
  );

  return (
    <section
      className="welcome-role-home fr-mb-3w"
      aria-labelledby="welcome-role-title"
    >
      {showSearch && searchTargets ? (
        <div className="welcome-role-home__bandeau">
          {greetingBlock}
          <WelcomeSearchBar targets={searchTargets} />
        </div>
      ) : (
        greetingBlock
      )}

      {content.ctas.length > 0 ? (
        <nav
          aria-label="Raccourcis selon votre rôle"
          className={
            showSearch || content.lead?.trim() ? undefined : "fr-mt-3w"
          }
        >
          <ul className="welcome-role-home__ctas fr-mb-0">
            {content.ctas.map((cta) => (
              <li key={cta.id} className="welcome-role-home__cta">
                <Button
                  priority={cta.id === content.ctas[0]?.id ? "primary" : "secondary"}
                  linkProps={{
                    href: cta.href,
                    onClick: onCtaClick(cta.href),
                  }}
                >
                  {cta.label}
                </Button>
                <p className="fr-text--sm fr-hint-text fr-mb-0 fr-mt-1w">
                  {cta.description}
                </p>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {content.hint ? (
        <CallOut
          className="fr-mt-3w"
          title="À savoir"
          titleAs="h2"
          colorVariant="blue-cumulus"
          bodyAs="div"
        >
          <p className="fr-mb-0">{content.hint}</p>
        </CallOut>
      ) : null}
    </section>
  );
}
