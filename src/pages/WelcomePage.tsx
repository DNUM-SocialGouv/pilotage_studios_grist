import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import {
  WIDGET_MODULE_LINKS,
  type WidgetNavStatus,
} from "../layout/WidgetNav";

const STATUS_LABEL: Record<WidgetNavStatus, string> = {
  available: "Disponible",
  coming: "À venir",
  out_of_scope: "Hors scope widget",
};

const STATUS_BADGE_CLASS: Record<WidgetNavStatus, string> = {
  available: "fr-badge--success",
  coming: "fr-badge--info",
  out_of_scope: "fr-badge--warning",
};

export function WelcomePage() {
  return (
    <>
      <h1 className="fr-h3">Pilotage studios</h1>
      <Alert
        severity="info"
        title="Produit en cours de réalisation"
        description="Ce widget Grist évolue progressivement. Certains écrans sont déjà disponibles ; d’autres arriveront au fil des livraisons."
        className="fr-mb-3w"
      />
      <h2 className="fr-h5">Pages du widget</h2>
      <ul className="fr-mt-2w">
        {WIDGET_MODULE_LINKS.map(({ text, href, status }) => (
          <li key={href} className="fr-mb-1w">
            <Link className="fr-link" to={href}>
              {text}
            </Link>
            {" "}
            <Badge small as="span" className={STATUS_BADGE_CLASS[status]}>
              {STATUS_LABEL[status]}
            </Badge>
          </li>
        ))}
      </ul>
    </>
  );
}
