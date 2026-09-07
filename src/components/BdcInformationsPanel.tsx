import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { BDC, PlanActivite } from "../types";
import { formatMontantEur } from "../utils/formatMontant";
import { libellePlanActivite } from "../utils/paFinance";
import { EquipeBadges } from "./EquipeBadges";
import { GristAttachmentDownloadLink, sofianeBdcCell } from "./GristAttachmentDownloadLink";

function BdcInfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fr-col-12 fr-col-sm-6 fr-col-lg-3">
      <p className="bdc-detail-info-field__label">{label}</p>
      <div className="bdc-detail-info-field__value">{children}</div>
    </div>
  );
}

export type BdcInformationsPanelProps = {
  bdc: BDC;
  linkedPa?: PlanActivite;
  paId?: number;
  resteAConsommer?: number | null;
};

export function BdcInformationsPanel({
  bdc,
  linkedPa,
  paId,
  resteAConsommer,
}: BdcInformationsPanelProps) {
  return (
    <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
      <BdcInfoField label="Financeur">{bdc.Financeur?.trim() || "—"}</BdcInfoField>
      <BdcInfoField label="Chorus">{bdc.BdC_Chorus?.trim() || "—"}</BdcInfoField>
      <BdcInfoField label="Plan d’activité">
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
      </BdcInfoField>
      <BdcInfoField label="Plateforme">{bdc.Plateforme?.trim() || "—"}</BdcInfoField>
      <BdcInfoField label="Engagement">{bdc.Engagement?.trim() || "—"}</BdcInfoField>
      <BdcInfoField label="Équipe">
        <EquipeBadges value={bdc.Equipe2} />
      </BdcInfoField>
      {resteAConsommer != null ? (
        <BdcInfoField label="Reste à consommer du PA">
          {formatMontantEur(resteAConsommer)}
        </BdcInfoField>
      ) : null}
      <BdcInfoField label="Sofiane">{sofianeBdcCell(bdc.SOFIANE)}</BdcInfoField>
      <BdcInfoField label="Devis">
        <GristAttachmentDownloadLink value={bdc.Devis} label="Télécharger le devis" />
      </BdcInfoField>
    </div>
  );
}
