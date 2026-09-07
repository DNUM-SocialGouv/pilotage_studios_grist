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
  className,
  disabled = false,
}: ExpandToggleProps) {
  const title = expanded ? titleCollapse : titleExpand;
  return (
    <Button
      type="button"
      size="small"
      priority="tertiary no outline"
      className={cx("pilotage-expand-toggle", expanded && "pilotage-expand-toggle--open", className)}
      disabled={disabled || childCount === 0}
      iconId="fr-icon-arrow-right-s-line"
      title={title}
      aria-expanded={expanded}
      aria-controls={controlsId}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children ?? childCount}
    </Button>
  );
}
