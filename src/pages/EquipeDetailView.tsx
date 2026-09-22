import { useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { EquipeAvatar } from "../components/equipe/EquipeAvatar";
import { EquipeFicheMissionsSection } from "../components/equipe/EquipeFicheMissionsSection";
import { StatutBadge } from "../components/StatutBadge";
import { tdEquipeTag } from "../components/EquipeTags";
import { WidgetBreadcrumb } from "../components/WidgetBreadcrumb";
import { equipeDisplayName, equipeMontantLisible } from "../utils/equipeList";
import { formatMontantEur } from "../utils/formatMontant";
import { useEquipeOutlet } from "./EquipeLayout";

const EQUIPE_CRUMB = [{ label: "Équipe", to: "/equipe" }] as const;

function readable(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t || undefined;
}

function metaColClassForCount(count: number): string {
  if (count >= 4) return "fr-col-12 fr-col-md-3";
  if (count === 3) return "fr-col-12 fr-col-md-4";
  if (count === 2) return "fr-col-12 fr-col-md-6";
  return "fr-col-12";
}

export function EquipeDetailView() {
  const { id } = useParams();
  const { data } = useEquipeOutlet();
  const memberId = id ? Number.parseInt(id, 10) : NaN;
  const member = data.members.find((m) => m.id === memberId);

  if (data.status === "loading" || data.status === "idle") {
    return (
      <div className="fr-py-1w">
        <WidgetBreadcrumb
          className="fr-mb-2w"
          segments={[...EQUIPE_CRUMB]}
          currentPageLabel="Chargement"
        />
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
        <WidgetBreadcrumb
          className="fr-mb-2w"
          segments={[...EQUIPE_CRUMB]}
          currentPageLabel="Erreur"
        />
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
        <WidgetBreadcrumb
          className="fr-mb-2w"
          segments={[...EQUIPE_CRUMB]}
          currentPageLabel="Introuvable"
        />
        <Alert
          severity="warning"
          title="Personne introuvable"
          description={`Aucune fiche Équipe avec l’id ${id ?? "—"}.`}
        />
      </div>
    );
  }

  const name = equipeDisplayName(member);
  const statut = readable(member.Statut);
  const role = readable(member.Role_ACL);
  const portage = readable(member.Portage);
  const specialite = readable(member.Specialite);
  const departement = readable(member.Equipe);
  const showTjm = equipeMontantLisible(member.TJM);
  const showTotalTtc = equipeMontantLisible(member.Total_TTC);

  const metaCells: { label: string; value: ReactNode }[] = [
    {
      label: "Département",
      value: departement ? tdEquipeTag(departement) : "—",
    },
  ];
  if (specialite) {
    metaCells.push({ label: "Spécialité", value: specialite });
  }
  // Visibles seulement si Access Rules les livrent (Admin / Owner / soi).
  if (showTjm) {
    metaCells.push({ label: "TJM", value: formatMontantEur(member.TJM) });
  }
  if (showTotalTtc) {
    metaCells.push({
      label: "Total TTC",
      value: formatMontantEur(member.Total_TTC),
    });
  }

  const metaColClass = metaColClassForCount(metaCells.length);

  return (
    <div className="fr-py-1w">
      <WidgetBreadcrumb
        className="fr-mb-2w"
        segments={[...EQUIPE_CRUMB]}
        currentPageLabel={name}
      />

      <div className="equipe-fiche-title-row fr-mb-2w">
        <div className="equipe-fiche-title-row__identity">
          <EquipeAvatar avatar={member.Avatar} memberId={member.id} size="lg" />
          <div className="equipe-fiche-title-row__text">
            {statut || role || portage ? (
              <ul className="fr-badges-group fr-mb-0">
                {statut ? (
                  <li>
                    <StatutBadge statut={statut} variant="equipe" />
                  </li>
                ) : null}
                {role ? (
                  <li>
                    <Badge small as="span" severity="info" noIcon>
                      {role}
                    </Badge>
                  </li>
                ) : null}
                {portage ? (
                  <li>
                    <Badge small as="span" noIcon>
                      {portage}
                    </Badge>
                  </li>
                ) : null}
              </ul>
            ) : null}
            <h1 className="fr-mb-0 fr-h3 equipe-fiche-title-row__title">{name}</h1>
          </div>
        </div>
      </div>

      <div
        className="fr-grid-row equipe-fiche-meta-bandeau fr-mb-4w"
        role="group"
        aria-label="Informations de la personne"
      >
        {metaCells.map((cell) => (
          <div
            key={cell.label}
            className={`${metaColClass} equipe-fiche-meta-bandeau__cell`}
          >
            <div className="fr-text--xs fr-mb-1v equipe-fiche-meta-bandeau__label">
              {cell.label}
            </div>
            <div className="fr-text--sm fr-mb-0">{cell.value}</div>
          </div>
        ))}
      </div>

      <EquipeFicheMissionsSection
        memberId={member.id}
        enabled={data.status === "ok"}
      />
    </div>
  );
}
