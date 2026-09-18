import { Link, useParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { equipeDisplayName } from "../utils/equipeList";
import { useEquipeOutlet } from "./EquipeLayout";

function dash(value: string | undefined): string {
  const t = value?.trim();
  return t || "—";
}

export function EquipeDetailView() {
  const { id } = useParams();
  const { data } = useEquipeOutlet();
  const memberId = id ? Number.parseInt(id, 10) : NaN;
  const member = data.members.find((m) => m.id === memberId);

  if (data.status === "loading" || data.status === "idle") {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/equipe">
            ← Retour à la liste
          </Link>
        </p>
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Connexion à Grist…"
          role="status"
        />
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/equipe">
            ← Retour à la liste
          </Link>
        </p>
        <Alert
          severity="error"
          title="Erreur"
          description={data.error ?? "La fiche n’a pas pu être chargée."}
        />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/equipe">
            ← Retour à la liste
          </Link>
        </p>
        <Alert
          severity="warning"
          title="Personne introuvable"
          description={`Aucune fiche Équipe avec l’id ${id ?? "—"}.`}
        />
      </div>
    );
  }

  return (
    <div className="fr-py-1w">
      <p className="fr-mb-2w">
        <Link className="fr-link" to="/equipe">
          ← Retour à la liste
        </Link>
      </p>
      <h1 className="fr-h3">{equipeDisplayName(member)}</h1>
      <p className="fr-text--sm fr-mb-3w">Consultation uniquement — pas d’édition dans le widget.</p>

      <dl className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Département</dt>
          <dd className="fr-mb-0">{dash(member.Equipe)}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Portage</dt>
          <dd className="fr-mb-0">{dash(member.Portage)}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Statut</dt>
          <dd className="fr-mb-0">{dash(member.Statut)}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Spécialité</dt>
          <dd className="fr-mb-0">{dash(member.Specialite)}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Rôle</dt>
          <dd className="fr-mb-0">{dash(member.Role_ACL)}</dd>
        </div>
        <div className="fr-col-12">
          <dt className="fr-text--sm">Missions en cours</dt>
          <dd className="fr-mb-0">{dash(member.Missions_en_cours)}</dd>
        </div>
      </dl>
    </div>
  );
}
