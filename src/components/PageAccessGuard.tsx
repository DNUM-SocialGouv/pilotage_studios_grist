import { Navigate, useLocation } from "react-router-dom";
import { useAclProfil } from "../AclProfilContext";
import { canAccessPath } from "../security/pageAccess";

type PageAccessGuardProps = {
  children: React.ReactNode;
};

/**
 * Garde de route (couche 5) : refuse l’écran si `Acl_profil.Page_*` est faux.
 * Pendant le chargement du profil : message d’attente (pas de flash de contenu).
 * Accueil (`/`) n’est pas enveloppé — redirection vers `/` si refus.
 */
export function PageAccessGuard({ children }: PageAccessGuardProps) {
  const { pathname } = useLocation();
  const { status, flags } = useAclProfil();

  if (status === "loading") {
    return (
      <p className="fr-text--sm fr-mt-2w" role="status">
        Vérification de vos droits d’accès…
      </p>
    );
  }

  if (canAccessPath(pathname, flags)) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
}
