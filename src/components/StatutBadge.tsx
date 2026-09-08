import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { severityForStatut } from "../utils/statutBadge";

type StatutBadgeProps = {
  statut: string | undefined;
};

export function StatutBadge({ statut }: StatutBadgeProps) {
  const label = statut?.trim() || "—";
  return <Badge severity={severityForStatut(statut)}>{label}</Badge>;
}
