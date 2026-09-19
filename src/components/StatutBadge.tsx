import { Badge } from "@codegouvfr/react-dsfr/Badge";
import {
  severityForEquipeStatut,
  severityForStatut,
} from "../utils/statutBadge";

type StatutBadgeProps = {
  statut: string | undefined;
  small?: boolean;
  /** Mapping Actif / Inactif pour la fiche Équipe. */
  variant?: "default" | "equipe";
};

export function StatutBadge({
  statut,
  small = true,
  variant = "default",
}: StatutBadgeProps) {
  const label = statut?.trim() || "—";
  const severity =
    variant === "equipe"
      ? severityForEquipeStatut(statut)
      : severityForStatut(statut);
  return (
    <Badge small={small} severity={severity} noIcon>
      {label}
    </Badge>
  );
}
