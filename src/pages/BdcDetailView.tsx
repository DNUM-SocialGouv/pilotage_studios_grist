import { Link, useParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { BdcFinanceRecap } from "../components/BdcFinanceRecap";
import { EquipeBadges } from "../components/EquipeBadges";
import { useGristPa } from "../GristPaContext";
import { NothingHerePage } from "../security/NothingHerePage";
import { formatMontantEur } from "../utils/formatMontant";
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

      <BdcFinanceRecap
        budgetTtc={bdc.Montant_TTC}
        consommeCra={bdc.Total_TTC_CRA}
        soldeCra={bdc.Solde_TTC_CRA}
      />

      <h2 className="fr-h5">Informations</h2>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <p className="bdc-detail-info-field__label">Financeur</p>
          <p className="bdc-detail-info-field__value">{bdc.Financeur?.trim() || "—"}</p>
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <p className="bdc-detail-info-field__label">Chorus</p>
          <p className="bdc-detail-info-field__value">{bdc.BdC_Chorus?.trim() || "—"}</p>
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <p className="bdc-detail-info-field__label">Plan d’activité</p>
          <p className="bdc-detail-info-field__value">
            {linkedPa ? (
              <Link className="fr-link" to={`/pa/${linkedPa.id}`}>
                {libellePlanActivite(linkedPa)}
              </Link>
            ) : paId != null ? (
              <Link className="fr-link" to={`/pa/${paId}`}>
                PA #{paId}
              </Link>
            ) : (
              "—"
            )}
          </p>
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <p className="bdc-detail-info-field__label">Plateforme</p>
          <p className="bdc-detail-info-field__value">{bdc.Plateforme?.trim() || "—"}</p>
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <p className="bdc-detail-info-field__label">Engagement</p>
          <p className="bdc-detail-info-field__value">{bdc.Engagement?.trim() || "—"}</p>
        </div>
        <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
          <p className="bdc-detail-info-field__label">Équipe</p>
          <div className="bdc-detail-info-field__value">
            <EquipeBadges value={bdc.Equipe2} />
          </div>
        </div>
        {paFinance ? (
          <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
            <p className="bdc-detail-info-field__label">Reste à consommer du PA</p>
            <p className="bdc-detail-info-field__value">
              {formatMontantEur(paFinance.resteAConsommer)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
