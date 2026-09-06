import { Link, useParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { TableShell } from "../components/FinanceRecap";
import { useGristPa } from "../GristPaContext";
import { NothingHerePage } from "../security/NothingHerePage";
import { EquipeBadges } from "../components/EquipeBadges";
import { formatMontantEur } from "../utils/formatMontant";
import { montantReste } from "../utils/montantReste";
import {
  bdcPaRefId,
  financeForPlanActivite,
  financePaOnly,
  libellePlanActivite,
} from "../utils/paFinance";

export function BdcDetailView() {
  const { id } = useParams();
  const data = useGristPa();
  const bdcId = id ? Number.parseInt(id, 10) : NaN;
  const bdc = data.bdcList.find((b) => b.id === bdcId);
  const useFullFinance = data.relatedStatus === "ok";

  if (data.untrustedEmbed || data.outsideGrist) {
    return <NothingHerePage />;
  }

  if (data.loading) {
    return (
      <div className="fr-py-1w">
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

  if (data.error) {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/bdc">
            ← Retour à la liste
          </Link>
        </p>
        <Alert severity="error" title="Erreur" description={data.error} />
      </div>
    );
  }

  if (data.relatedStatus === "denied" || data.relatedStatus === "error") {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/bdc">
            ← Retour à la liste
          </Link>
        </p>
        <Alert
          severity="warning"
          title="Accès multi-tables indisponible"
          description={
            data.relatedError ??
            "Accordez l’accès « full » au widget pour afficher la fiche BDC."
          }
        />
      </div>
    );
  }

  if (data.relatedStatus === "loading" || data.relatedStatus === "idle") {
    return (
      <div className="fr-py-1w">
        <Alert
          severity="info"
          small
          title="Chargement"
          description="Chargement du bon de commande…"
          role="status"
        />
      </div>
    );
  }

  if (!bdc) {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/bdc">
            ← Retour à la liste
          </Link>
        </p>
        <Alert
          severity="warning"
          title="BDC introuvable"
          description={`Aucune ligne BDC avec l’id ${id ?? "—"}.`}
        />
      </div>
    );
  }

  const paId = bdcPaRefId(bdc);
  const linkedPa = paId != null ? data.plans.find((p) => p.id === paId) : undefined;
  const paFinance =
    linkedPa != null
      ? useFullFinance
        ? financeForPlanActivite(linkedPa, data.bdcList, data.constatations, data.commandes)
        : financePaOnly(linkedPa)
      : null;
  return (
    <div className="fr-py-1w">
      <p className="fr-mb-2w">
        <Link className="fr-link" to="/bdc">
          ← Retour à la liste
        </Link>
      </p>
      <p className="fr-text--sm fr-mb-1v">{bdc.Statut?.trim() || "Sans statut"}</p>
      <h1 className="fr-h3">{bdc.Nom_BdC?.trim() || `BDC #${bdc.id}`}</h1>

      <h2 className="fr-h5">Synthèse financière</h2>
      <TableShell className="fr-mb-3w">
        <table>
          <caption className="fr-sr-only">Montants du bon de commande</caption>
          <thead>
            <tr>
              <th scope="col" className="fr-cell--right">
                Budget TTC
              </th>
              <th scope="col" className="fr-cell--right">
                Consommé CRA
              </th>
              <th scope="col" className="fr-cell--right">
                Solde CRA
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="fr-cell--right">{formatMontantEur(bdc.Montant_TTC)}</td>
              <td className="fr-cell--right">{formatMontantEur(bdc.Total_TTC_CRA)}</td>
              <td className="fr-cell--right">{montantReste(bdc.Solde_TTC_CRA)}</td>
            </tr>
          </tbody>
        </table>
      </TableShell>

      <h2 className="fr-h5">Informations</h2>
      <dl className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Financeur</dt>
          <dd className="fr-mb-0">{bdc.Financeur?.trim() || "—"}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Chorus</dt>
          <dd className="fr-mb-0">{bdc.BdC_Chorus?.trim() || "—"}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Plan d’activité</dt>
          <dd className="fr-mb-0">
            {linkedPa ? (
              <>
                <Link className="fr-link" to={`/pa/${linkedPa.id}`}>
                  {libellePlanActivite(linkedPa)}
                </Link>
                {paFinance ? (
                  <span className="fr-text--sm">
                    {" "}
                    · reste à consommer {formatMontantEur(paFinance.resteAConsommer)}
                  </span>
                ) : null}
              </>
            ) : paId != null ? (
              <Link className="fr-link" to={`/pa/${paId}`}>
                PA #{paId}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Plateforme</dt>
          <dd className="fr-mb-0">{bdc.Plateforme?.trim() || "—"}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Engagement</dt>
          <dd className="fr-mb-0">{bdc.Engagement?.trim() || "—"}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-4">
          <dt className="fr-text--sm">Équipe</dt>
          <dd className="fr-mb-0">
            <EquipeBadges value={bdc.Equipe2} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
