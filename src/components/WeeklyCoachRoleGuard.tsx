import type { ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Navigate } from "react-router-dom";
import { useAclProfil } from "../AclProfilContext";
import { useWeeklyCoachAllowlist } from "../hooks/useWeeklyCoachAllowlist";
import { isMonCarnetManagerRole } from "../utils/droitsPagesThemes";
import { canAccessWeeklyCoach } from "../utils/weeklyCoachAccess";

type WeeklyCoachRoleGuardProps = {
  children: ReactNode;
};

/**
 * Garde Weekly (hors `Page_*`) : Admin / Resp. + Freelance présents dans
 * `Weekly_coachs` (Grist). Standalone : ouvert. Autres → Accueil.
 */
export function WeeklyCoachRoleGuard({ children }: WeeklyCoachRoleGuardProps) {
  const { status, role, email, error } = useAclProfil();
  const needsAllowlist =
    status === "ok" && !isMonCarnetManagerRole(role) && (role ?? "").trim() === "Freelance";
  const allowlist = useWeeklyCoachAllowlist(needsAllowlist);

  if (status === "loading") {
    return (
      <p className="fr-text--sm fr-mt-2w" role="status">
        Vérification de vos droits d’accès…
      </p>
    );
  }

  if (status === "error") {
    return (
      <Alert
        className="fr-mt-2w"
        severity="error"
        title="Profil d’accès indisponible"
        description={
          error ??
          "Impossible de vérifier votre rôle pour ouvrir Weekly."
        }
      />
    );
  }

  if (status === "empty") {
    return (
      <Alert
        className="fr-mt-2w"
        severity="warning"
        title="Aucune fiche de rôle"
        description="Votre fiche d’accès (Acl_profil) n’a pas pu être créée ou lue : impossible de confirmer le droit d’ouvrir Weekly."
      />
    );
  }

  if (status === "standalone") {
    return <>{children}</>;
  }

  if (needsAllowlist && allowlist.status === "loading") {
    return (
      <p className="fr-text--sm fr-mt-2w" role="status">
        Vérification de vos droits d’accès…
      </p>
    );
  }

  if (needsAllowlist && allowlist.status === "error") {
    return (
      <Alert
        className="fr-mt-2w"
        severity="error"
        title="Liste des coachs indisponible"
        description={
          allowlist.error ??
          "Impossible de vérifier si vous êtes autorisé·e à ouvrir Weekly."
        }
      />
    );
  }

  if (
    canAccessWeeklyCoach({
      role,
      email,
      coachEmails: allowlist.emails,
    })
  ) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
}
