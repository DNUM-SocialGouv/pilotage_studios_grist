import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { BdcDepensesPanel } from "../components/BdcDepensesPanel";
import { BdcFinanceRecap } from "../components/BdcFinanceRecap";
import { BdcInformationsPanel } from "../components/BdcInformationsPanel";
import { useGristPa } from "../GristPaContext";
import { useBdcDepensesData } from "../hooks/useBdcDepensesData";
import { NothingHerePage } from "../security/NothingHerePage";
import { bdcPaRefId, financeForPlanActivite, financePaOnly } from "../utils/paFinance";

type BdcTabId = "depenses" | "informations" | "pv";

export function BdcDetailView() {
  const { id } = useParams();
  const data = useGristPa();
  const bdcId = id ? Number.parseInt(id, 10) : NaN;
  const bdc = data.bdcList.find((b) => b.id === bdcId);
  const useFullFinance = data.relatedStatus === "ok";
  const [suiviTabId, setSuiviTabId] = useState<BdcTabId>("depenses");
  const depenses = useBdcDepensesData(bdc?.id);

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

      <Tabs
        label="Sections du bon de commande"
        className="fr-mb-2w"
        selectedTabId={suiviTabId}
        onTabChange={(tabId) => {
          if (tabId === "pv") {
            setSuiviTabId("pv");
          } else if (tabId === "informations") {
            setSuiviTabId("informations");
          } else {
            setSuiviTabId("depenses");
          }
        }}
        tabs={[
          {
            tabId: "depenses",
            label: "Dépenses",
            iconId: "fr-icon-table-line",
          },
          {
            tabId: "informations",
            label: "Informations",
            iconId: "fr-icon-information-line",
          },
          {
            tabId: "pv",
            label: "PV",
            iconId: "fr-icon-file-line",
          },
        ]}
      >
        {suiviTabId === "depenses" ? (
          <BdcDepensesPanel data={depenses} />
        ) : suiviTabId === "informations" ? (
          <BdcInformationsPanel
            bdc={bdc}
            linkedPa={linkedPa}
            paId={paId}
            resteAConsommer={paFinance?.resteAConsommer}
          />
        ) : (
          <Alert
            severity="info"
            title="À venir"
            description="Les procès-verbaux seront affichés ici une fois l’écran PV livré."
          />
        )}
      </Tabs>
    </div>
  );
}
