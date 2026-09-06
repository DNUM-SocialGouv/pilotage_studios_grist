import { Link, useParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { FinanceRecap, TableShell } from "../components/FinanceRecap";
import { useGristPa } from "../GristPaContext";
import { formatMontantEur } from "../utils/formatMontant";
import {
  bdcPaRefId,
  financeForPlanActivite,
  financePaOnly,
  libellePlanActivite,
} from "../utils/paFinance";

export function PaDetailView() {
  const { id } = useParams();
  const data = useGristPa();
  const paId = id ? Number.parseInt(id, 10) : NaN;
  const pa = data.plans.find((p) => p.id === paId);
  const useFullFinance = data.relatedStatus === "ok";

  if (!pa) {
    return (
      <div className="fr-py-1w">
        <p className="fr-mb-2w">
          <Link className="fr-link" to="/pa">
            ← Retour à la liste
          </Link>
        </p>
        <Alert
          severity="warning"
          title="PA introuvable"
          description={`Aucune ligne Plan_activite avec l’id ${id ?? "—"}.`}
        />
      </div>
    );
  }

  const finance = useFullFinance
    ? financeForPlanActivite(pa, data.bdcList, data.constatations, data.commandes)
    : financePaOnly(pa);
  const paBdcs = useFullFinance
    ? data.bdcList.filter((bdc) => bdcPaRefId(bdc) === pa.id)
    : [];

  return (
    <div className="fr-py-1w">
      <p className="fr-mb-2w">
        <Link className="fr-link" to="/pa">
          ← Retour à la liste
        </Link>
      </p>
      <h1 className="fr-h3">{libellePlanActivite(pa)}</h1>

      <dl className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
        <div className="fr-col-6 fr-col-md-3">
          <dt className="fr-text--sm">Année</dt>
          <dd className="fr-mb-0">{pa.Annee ?? "—"}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-3">
          <dt className="fr-text--sm">Bureau</dt>
          <dd className="fr-mb-0">{pa.Bureau?.trim() || "—"}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-3">
          <dt className="fr-text--sm">Priorité</dt>
          <dd className="fr-mb-0">{pa.Priorite?.trim() || "—"}</dd>
        </div>
        <div className="fr-col-6 fr-col-md-3">
          <dt className="fr-text--sm">Responsable</dt>
          <dd className="fr-mb-0">{pa.Responsable_activite?.trim() || "—"}</dd>
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <dt className="fr-text--sm">Domaine</dt>
          <dd className="fr-mb-0">
            {[pa.Domaine, pa.Sous_domaine].filter(Boolean).join(" · ") || "—"}
          </dd>
        </div>
      </dl>

      <FinanceRecap
        enveloppe={finance.enveloppe}
        engage={finance.engage}
        payeSofiane={finance.payeSofiane}
        resteAConsommer={finance.resteAConsommer}
      />

      <h2 className="fr-h5">BDC rattachés</h2>
      {!useFullFinance ? (
        <Alert
          severity="info"
          small
          title="Accès limité"
          description="Accordez l’accès « full » au widget pour lister les BDC."
        />
      ) : (
        <TableShell>
          <table>
            <caption className="fr-sr-only">BDC du plan d’activité</caption>
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col" className="fr-cell--right">
                  Montant TTC
                </th>
                <th scope="col" className="fr-cell--right">
                  Consommé CRA
                </th>
              </tr>
            </thead>
            <tbody>
              {paBdcs.length === 0 ? (
                <tr>
                  <td colSpan={3}>Aucun BDC rattaché.</td>
                </tr>
              ) : (
                paBdcs.map((bdc) => (
                  <tr key={bdc.id}>
                    <th scope="row">
                      <Link className="fr-link" to={`/bdc/${bdc.id}`}>
                        {bdc.Nom_BdC?.trim() || `BDC #${bdc.id}`}
                      </Link>
                    </th>
                    <td className="fr-cell--right">{formatMontantEur(bdc.Montant_TTC)}</td>
                    <td className="fr-cell--right">{formatMontantEur(bdc.Total_TTC_CRA)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
