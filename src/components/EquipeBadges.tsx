import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { equipeBadgeClass } from "../utils/equipeBadge";
import { extractGristStringTokens } from "../utils/gristReferences";

type EquipeBadgesProps = {
  /** Valeur Grist ChoiceList / chaîne / tokens. */
  value: unknown;
  className?: string;
  empty?: string;
};

/**
 * Badges couleur pour les équipes — même mapping partout (`equipeBadgeClass`).
 */
export function EquipeBadges({ value, className, empty = "—" }: EquipeBadgesProps) {
  const labels = extractGristStringTokens(value);

  if (labels.length === 0) {
    return <>{empty}</>;
  }

  return (
    <ul className={["fr-badges-group", className].filter(Boolean).join(" ")}>
      {labels.map((label) => (
        <li key={label}>
          <Badge small as="span" className={equipeBadgeClass(label)}>
            {label}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
