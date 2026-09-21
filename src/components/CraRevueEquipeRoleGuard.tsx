import type { ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Navigate } from "react-router-dom";
import { useAclProfil } from "../AclProfilContext";
import { isCraRevueEquipeRole } from "../utils/droitsPagesThemes";

type CraRevueEquipeRoleGuardProps = {
  children: ReactNode;
};

/**
 * Garde Admin / Responsable de département pour « Revue CRA équipe » (hors `Page_*`).
 * Le contrôle « département renseigné » est dans la page (fiche Equipe).
 * Standalone / preview locale : accès ouvert.
 */
export function CraRevueEquipeRoleGuard({ children }: CraRevueEquipeRoleGuardProps) {
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
          "Impossible de vérifier votre rôle pour ouvrir la revue CRA équipe."
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
        description="Votre fiche d’accès (Acl_profil) n’a pas pu être créée ou lue : impossible de confirmer le droit de revue CRA."
      />
    );
  }

  if (status === "standalone" || isCraRevueEquipeRole(role)) {
    return <>{children}</>;
  }

  return <Navigate to="/" replace />;
}
