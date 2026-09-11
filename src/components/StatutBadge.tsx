import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { severityForStatut } from "../utils/statutBadge";

type StatutBadgeProps = {
  statut: string | undefined;
  small?: boolean;
};

export function StatutBadge({ statut, small = true }: StatutBadgeProps) {
  const label = statut?.trim() || "—";
  return (
    <Badge small={small} severity={severityForStatut(statut)} noIcon>
      {label}
    </Badge>
  );
}
