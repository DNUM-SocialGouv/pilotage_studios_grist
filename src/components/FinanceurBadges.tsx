import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { financeurBadgeClass } from "../utils/financeurBadge";

type FinanceurBadgesProps = {
  /** Libellé financeur Grist (texte simple). */
  value: string | undefined | null;
  className?: string;
  empty?: string;
};

/**
 * Badge couleur pour le financeur — même langage visuel que `EquipeBadges`.
 */
export function FinanceurBadges({
  value,
  className,
  empty = "—",
}: FinanceurBadgesProps) {
  const label = value?.trim() ?? "";

  if (!label) {
    return <>{empty}</>;
  }

  return (
    <ul className={["fr-badges-group", className].filter(Boolean).join(" ")}>
      <li>
        <Badge small as="span" className={financeurBadgeClass(label)}>
          {label}
        </Badge>
      </li>
    </ul>
  );
}
