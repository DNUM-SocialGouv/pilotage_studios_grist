import { Navigate } from "react-router-dom";
import { useAclProfil } from "../AclProfilContext";
import { isAdminRole } from "../utils/droitsPagesThemes";

type AdminRoleGuardProps = {
  children: React.ReactNode;
};

/**
 * Garde Admin (indépendante des `Page_*`) : page de réglage des droits.
 * Standalone / preview locale : accès ouvert pour développer hors iframe.
 */
export function AdminRoleGuard({ children }: AdminRoleGuardProps) {
  const { status, role } = useAclProfil();

  if (status === "loading") {
    return (
      <p className="fr-text--sm fr-mt-2w" role="status">
        Vérification de vos droits d’accès…
      </p>
    );
  }

  if (status === "standalone" || isAdminRole(role)) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
}
