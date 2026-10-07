import type { MouseEvent, RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import type { VosRetoursStatus } from "../../hooks/useVosRetours";
import type { KanbanTicket } from "../../utils/kanbanTickets";
import type { VosRetourItem } from "../../utils/vosRetours";
import type { WelcomeHomeContent } from "../../utils/welcomeHomeByRole";
import {
  hasWelcomeSearchTargets,
  shouldShowWelcomeSearch,
  type WelcomeSearchTargetFlags,
} from "../../utils/welcomeSearch";
import { WelcomeSearchBar } from "./WelcomeSearchBar";
import { VosRetoursSection } from "./VosRetoursSection";

type WelcomeRoleHomeProps = {
  content: WelcomeHomeContent;
  /** Pendant le chargement du profil : message court sans CTA. */
  loading?: boolean;
  /**
   * Cibles recherche selon `Page_*` (Produits / Missions / Équipe).
   * Absentes ou toutes fermées → pas de barre.
   */
  searchTargets?: WelcomeSearchTargetFlags;
  /** Bloc « Vos retours » (Option 3) — masqué si `visible` false. */
  vosRetours?: {
    visible: boolean;
    status: VosRetoursStatus;
    actifs: VosRetourItem[];
    archives: VosRetourItem[];
    mineCount: number;
    error: string | null;
    onOpenTicket: (ticket: KanbanTicket) => void;
    itemButtonRefs: RefObject<Map<number, HTMLButtonElement>>;
    sectionTitleRef?: RefObject<HTMLHeadingElement | null>;
  };
};

/**
 * Accueil Option 3 : bandeau recherche ; puis raccourcis | Vos retours (≥ md) ;
 * mobile = empilement retours puis raccourcis (esprit Option 1).
 */
export function WelcomeRoleHome({
  content,
  loading,
  searchTargets,
  vosRetours,
}: WelcomeRoleHomeProps) {
  const navigate = useNavigate();
  const showProductLabel = content.showProductLabel !== false;
  const showSearch =
    !loading &&
    searchTargets != null &&
    shouldShowWelcomeSearch(content.kind) &&
    hasWelcomeSearchTargets(searchTargets);
  const showVosRetours = Boolean(vosRetours?.visible);

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

  const shortcutsNav =
    content.ctas.length > 0 ? (
      <nav
        aria-label="Raccourcis selon votre rôle"
        className="welcome-role-home__shortcuts"
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
    ) : null;

  const vosRetoursBlock =
    showVosRetours && vosRetours ? (
      <VosRetoursSection
        status={vosRetours.status}
        actifs={vosRetours.actifs}
        archives={vosRetours.archives}
        mineCount={vosRetours.mineCount}
        error={vosRetours.error}
        onOpenTicket={vosRetours.onOpenTicket}
        itemButtonRefs={vosRetours.itemButtonRefs}
        sectionTitleRef={vosRetours.sectionTitleRef}
      />
    ) : null;

  const mainTwoCol = showVosRetours || shortcutsNav;

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

      {mainTwoCol ? (
        <div
          className={
            showVosRetours && shortcutsNav
              ? "welcome-role-home__main welcome-role-home__main--split"
              : "welcome-role-home__main"
          }
        >
          {/* DOM : retours puis raccourcis (mobile Option 1) ; desktop grid place raccourcis à gauche. */}
          {vosRetoursBlock}
          {shortcutsNav}
        </div>
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
