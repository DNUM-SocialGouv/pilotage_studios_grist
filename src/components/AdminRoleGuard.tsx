import type { ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Navigate } from "react-router-dom";
import { useAclProfil } from "../AclProfilContext";
import { isAdminRole } from "../utils/droitsPagesThemes";

type AdminRoleGuardProps = {
  children: ReactNode;
};

/**
 * Garde Admin (indépendante des `Page_*`) : page de réglage des droits.
 * Standalone / preview locale : accès ouvert pour développer hors iframe.
 */
export function AdminRoleGuard({ children }: AdminRoleGuardProps) {
  const { status, role, error } = useAclProfil();

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
          "Impossible de vérifier si vous êtes Admin. Réessayez ou rechargez le widget."
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
        description="Votre profil Acl_profil est vide : impossible de confirmer le rôle Admin pour ouvrir cette page."
      />
    );
  }

  if (status === "standalone" || isAdminRole(role)) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
}
