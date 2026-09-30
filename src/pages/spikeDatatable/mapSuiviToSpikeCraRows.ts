import type { Mission, MissionEnfant, ProduitSdpc, SuiviMensuel } from "../../types.ts";
import {
  formatGristPeriodeMoisAnnee,
  labelBdcCra,
  labelIntervenantSuivi,
  labelMissionCra,
  labelProduitSuivi,
  missionsByIdFromRows,
} from "../../utils/craList.ts";
import { produitsByIdFromRows } from "../../utils/missionsList.ts";
import { montantTtcSuiviMensuel } from "../../utils/suiviMensuel.ts";
import type { SpikeCraRow } from "./spikeCraRow.ts";

type MapArgs = {
  suivi: SuiviMensuel[];
  intervenants: { id: number; Prenom_Nom?: string | null }[];
  produits: ProduitSdpc[];
  missions: Mission[];
  missionEnfants: MissionEnfant[];
  bdcList: { id: number; Nom_BdC?: string | null }[];
};

/** Projette les réalisations Grist vers des lignes plates pour TanStack. */
export function mapSuiviToSpikeCraRows({
  suivi,
  intervenants,
  produits,
  missions,
  missionEnfants,
  bdcList,
}: MapArgs): SpikeCraRow[] {
  const intervenantsById = new Map<number, string>();
  for (const i of intervenants) {
    intervenantsById.set(i.id, i.Prenom_Nom?.trim() || `Intervenant #${i.id}`);
  }
  const produitsById = produitsByIdFromRows(produits);
  const missionsById = missionsByIdFromRows(missions);
  const enfantsById = new Map<number, MissionEnfant>();
  for (const e of missionEnfants) {
    enfantsById.set(e.id, e);
  }
  const bdcById = new Map<number, string>();
  for (const b of bdcList) {
    bdcById.set(b.id, b.Nom_BdC?.trim() || `BDC #${b.id}`);
  }

  return suivi.map((s) => {
    const jours =
      typeof s.Nb_jours === "number" && Number.isFinite(s.Nb_jours) ? s.Nb_jours : 0;
    const ttc = montantTtcSuiviMensuel(s) ?? 0;
    return {
      id: s.id,
      periode: formatGristPeriodeMoisAnnee(s.Periode, s) || "—",
      intervenant: labelIntervenantSuivi(s, intervenantsById),
      equipe: s.Equipe?.trim() || "—",
      produit: labelProduitSuivi(s, produitsById),
      mission: labelMissionCra(s, missionsById, enfantsById, intervenantsById),
      bdc: labelBdcCra(s, bdcById),
      jours,
      ttc,
    };
  });
}
