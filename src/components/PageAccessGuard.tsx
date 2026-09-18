import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAclProfil } from "../AclProfilContext";
import { canAccessPath } from "../security/pageAccess";

type PageAccessGuardProps = {
  children: React.ReactNode;
};

/**
 * Garde de route (couche 5) : refuse l’écran si `Acl_profil.Page_*` est faux.
 * Fail-closed pendant le chargement sur les chemins sensibles déjà mappés.
 */
export function PageAccessGuard({ children }: PageAccessGuardProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
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

  if (pathname !== "/") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="fr-mt-2w">
      <Alert
        severity="warning"
        title="Accès non autorisé"
        description="Vous n’avez pas accès à cet écran avec votre profil actuel. Si besoin, contactez un administrateur Pilotage."
      />
      <Button className="fr-mt-2w" priority="secondary" onClick={() => navigate("/")}>
        Retour à l’accueil
      </Button>
    </div>
  );
}
