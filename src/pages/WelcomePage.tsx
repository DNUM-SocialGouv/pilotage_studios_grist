import { Link } from "react-router-dom";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Factory from "@codegouvfr/react-dsfr/picto/Factory";
import {
  WIDGET_MODULE_LINKS,
  type WidgetNavStatus,
} from "../layout/WidgetNav";

const STATUS_LABEL: Record<WidgetNavStatus, string> = {
  in_progress: "En cours",
  coming: "À venir",
};

const STATUS_BADGE_CLASS: Record<WidgetNavStatus, string> = {
  in_progress: "fr-badge--new",
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
      </div>
    </div>
  );
}
