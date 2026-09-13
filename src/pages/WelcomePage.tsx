import { Link } from "react-router-dom";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Factory from "@codegouvfr/react-dsfr/picto/Factory";
import {
  PUBLIC_ROADMAP_INTRO,
  PUBLIC_ROADMAP_ITEMS,
  ROADMAP_STATUS_BADGE_CLASS,
  ROADMAP_STATUS_LABEL,
} from "../content/publicRoadmap";
import {
  WIDGET_MODULE_LINKS,
  type WidgetNavStatus,
} from "../layout/WidgetNav";

const STATUS_LABEL: Record<WidgetNavStatus, string> = {
  in_progress: "En cours",
  coming: "À venir",
};

const STATUS_BADGE_CLASS: Record<WidgetNavStatus, string> = {
  in_progress: "",
  coming: "fr-badge--info",
};

export function WelcomePage() {
  return (
    <div className="welcome-page">
      <div className="welcome-page__panel">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-sm-7">
            <h1 className="fr-h3">Pilotage studios</h1>
            <ul className="fr-mt-2w">
              {WIDGET_MODULE_LINKS.map(({ text, href, status }) => (
                <li key={href} className="fr-mb-1w">
                  <Link className="fr-link" to={href}>
                    {text}
                  </Link>{" "}
                  <Badge small as="span" className={STATUS_BADGE_CLASS[status]}>
                    {STATUS_LABEL[status]}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          <div className="fr-col-12 fr-col-sm-5">
            <div className="welcome-artwork" aria-hidden="true">
              <Factory fontSize="7rem" color="blue-ecume" />
            </div>
          </div>
        </div>

        <section className="welcome-roadmap fr-mt-4w" aria-labelledby="welcome-roadmap-title">
          <h2 id="welcome-roadmap-title" className="fr-h5">
            Feuille de route
          </h2>
          <p className="fr-text--sm fr-mb-2w">{PUBLIC_ROADMAP_INTRO}</p>
          <p className="fr-text--sm fr-mb-2w">
            Commentez les étapes « En cours » ou « À venir » sur GitHub pour discuter ensemble.
            Pour un signal rapide dans l’app, utilisez le bouton « Un retour ? ».
          </p>
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
