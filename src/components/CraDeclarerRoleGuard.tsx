import type { ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Navigate } from "react-router-dom";
import { useAclProfil } from "../AclProfilContext";
import { isCraDeclarerRole } from "../utils/droitsPagesThemes";

type CraDeclarerRoleGuardProps = {
  children: ReactNode;
};

/**
 * Garde Mon carnet : Freelance (saisie) / Admin & Resp. (liste dép.) (hors `Page_*`).
 * Standalone / preview locale : accès ouvert. Invité → redirection.
 */
export function CraDeclarerRoleGuard({ children }: CraDeclarerRoleGuardProps) {
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
          "Impossible de vérifier votre rôle pour ouvrir la déclaration de CRA."
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
        description="Votre fiche d’accès (Acl_profil) n’a pas pu être créée ou lue : impossible de confirmer le droit de déclarer un CRA."
      />
    );
  }

  if (status === "standalone" || isCraDeclarerRole(role)) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
}
