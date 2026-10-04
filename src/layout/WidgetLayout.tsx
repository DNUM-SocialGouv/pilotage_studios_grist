import { Outlet } from "react-router-dom";
// Implémentation réelle (pas l’export déprécié `@codegouvfr/react-dsfr/Display` qui renvoie null).
// Même chemin que Header/Footer du package — le widget n’a ni Header Marianne ni Footer.
import { Display } from "@codegouvfr/react-dsfr/Display/Display";
import { FeedbackWidget } from "../components/feedback/FeedbackWidget";
import { WidgetNav } from "./WidgetNav";

/** Coquille iframe : chrome WidgetNav (Retour · nav · menu user) + main (pas de Header Marianne / Footer). */
export function WidgetLayout() {
  return (
    <div className="widget-shell">
      <WidgetNav />
      <main id="main-content" className="fr-container fr-pb-4w" tabIndex={-1}>
        <Outlet />
      </main>
      <FeedbackWidget />
      {/* Modale officielle Paramètres d’affichage (ouvert depuis le menu compte). */}
      <Display />
    </div>
  );
}
