import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Factory from "@codegouvfr/react-dsfr/picto/Factory";
import {
  PUBLIC_ROADMAP_CTA,
  PUBLIC_ROADMAP_INTRO,
  PUBLIC_ROADMAP_ITEMS,
  ROADMAP_STATUS_BADGE_CLASS,
  ROADMAP_STATUS_LABEL,
} from "../content/publicRoadmap";

export function WelcomePage() {
  return (
    <div className="welcome-page">
      <div className="welcome-page__panel">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-sm-7">
            <h1 className="fr-h3">Pilotage studios</h1>
          </div>
          <div className="fr-col-12 fr-col-sm-5">
            <div className="welcome-artwork" aria-hidden="true">
              <Factory fontSize="7rem" color="blue-ecume" />
            </div>
          </div>
        </div>

        <section className="welcome-roadmap fr-mt-3w" aria-labelledby="welcome-roadmap-title">
          <h2 id="welcome-roadmap-title" className="fr-h5">
            Feuille de route
          </h2>
          <p className="fr-text--sm fr-mb-2w">{PUBLIC_ROADMAP_INTRO}</p>
          <p className="fr-text--sm fr-mb-2w">{PUBLIC_ROADMAP_CTA}</p>
          <ol className="welcome-roadmap__list fr-mb-0">
            {PUBLIC_ROADMAP_ITEMS.map((item) => (
              <li key={item.id} className="welcome-roadmap__item fr-mb-2w">
                <div className="welcome-roadmap__item-head">
                  <span className="welcome-roadmap__title">{item.title}</span>{" "}
                  <Badge small as="span" className={ROADMAP_STATUS_BADGE_CLASS[item.status]}>
                    {ROADMAP_STATUS_LABEL[item.status]}
                  </Badge>
                </div>
                <p className="fr-text--sm fr-mb-1w">{item.summary}</p>
                {item.issueUrl ? (
                  <a
                    className="fr-link fr-link--sm"
                    href={item.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Discuter sur GitHub
                    <span className="fr-sr-only"> (nouvelle fenêtre) — {item.title}</span>
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
