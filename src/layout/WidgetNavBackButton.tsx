import { Button } from "@codegouvfr/react-dsfr/Button";
import { useWidgetGoBack } from "../hooks/useMemoryCanGoBack";

/** Bouton « Page précédente » — chevron seul, chrome gauche. */
export function WidgetNavBackButton() {
  const { canGoBack, goBack } = useWidgetGoBack();

  return (
    <Button
      type="button"
      priority="tertiary no outline"
      size="small"
      iconId="fr-icon-arrow-left-s-line"
      disabled={!canGoBack}
      title="Page précédente"
      className="widget-nav__back-btn"
      nativeButtonProps={{
        "aria-label": "Page précédente",
      }}
      onClick={goBack}
    />
  );
}
