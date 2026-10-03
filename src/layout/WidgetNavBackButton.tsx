import { Button } from "@codegouvfr/react-dsfr/Button";
import { useWidgetGoBack } from "../hooks/useMemoryCanGoBack";

/** Bouton « Page précédente » — chrome gauche, hors menu utilisateur. */
export function WidgetNavBackButton() {
  const { canGoBack, goBack } = useWidgetGoBack();
  const title = canGoBack
    ? "Page précédente"
    : "Aucune page précédente dans le widget";

  return (
    <Button
      type="button"
      priority="tertiary no outline"
      iconId="fr-icon-arrow-go-back-line"
      iconPosition="left"
      disabled={!canGoBack}
      title={title}
      className="widget-nav__back-btn"
      onClick={goBack}
    >
      Page précédente
    </Button>
  );
}
