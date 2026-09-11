import { Button } from "@codegouvfr/react-dsfr/Button";
import type { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";

export type ExpandToggleProps = {
  expanded: boolean;
  childCount: number;
  controlsId: string;
  onClick: () => void;
  titleExpand?: string;
  titleCollapse?: string;
  children?: ButtonProps["children"];
  /**
   * Affiche le compteur sur le bouton (à côté du chevron).
   * `false` : chevron seul — placer un badge à côté du libellé.
   */
  showCount?: boolean;
  className?: string;
  disabled?: boolean;
};

/** Bouton d’expansion de ligne (chevron rotatif + compteur). */
export function ExpandToggle({
  expanded,
  childCount,
  controlsId,
  onClick,
  titleExpand = "Afficher le détail",
  titleCollapse = "Masquer le détail",
  children,
  showCount = true,
  className,
  disabled = false,
}: ExpandToggleProps) {
  const title = expanded ? titleCollapse : titleExpand;
  return (
    <Button
      type="button"
      size="small"
      priority="tertiary no outline"
      className={cx(
        "pilotage-expand-toggle",
        expanded && "pilotage-expand-toggle--open",
        !showCount && "pilotage-expand-toggle--icon-only",
        className,
      )}
      disabled={disabled || childCount === 0}
      iconId="fr-icon-arrow-right-s-line"
      title={title}
      nativeButtonProps={{
        "aria-label": `${title} (${childCount})`,
        "aria-expanded": expanded,
        "aria-controls": controlsId,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {showCount ? (children ?? childCount) : null}
    </Button>
  );
}
