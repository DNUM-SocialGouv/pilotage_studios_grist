import type { Mission } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";

export const DEFAULT_MISSION_STATUT = "A instruire";

export type MissionFormValues = {
  Nom_de_la_mission: string;
  Produit_SDPC: string;
  Statut: string;
  prestationIntervenant: string;
  prestationLibelle: string;
  prestationJoursEnvisages: string;
};

export function emptyMissionCreateForm(): MissionFormValues {
  return {
    Nom_de_la_mission: "",
    Produit_SDPC: "",
    Statut: DEFAULT_MISSION_STATUT,
    prestationIntervenant: "",
    prestationLibelle: "",
    prestationJoursEnvisages: "",
  };
}

export function missionToFormValues(m: Mission): MissionFormValues {
  const prodId = extractGristReferenceId(m.Produit_SDPC);
  return {
    Nom_de_la_mission: m.Nom_de_la_mission?.trim() ?? "",
    Produit_SDPC:
      prodId != null && Number.isFinite(prodId) && prodId !== 0 ? String(prodId) : "",
    Statut: m.Statut?.trim() || DEFAULT_MISSION_STATUT,
    prestationIntervenant: "",
    prestationLibelle: "",
    prestationJoursEnvisages: "",
  };
}

export function buildMissionCreateFields(
  values: MissionFormValues,
): Partial<Omit<Mission, "id">> {
  const out: Partial<Omit<Mission, "id">> = {
    Nom_de_la_mission: values.Nom_de_la_mission.trim(),
    Statut: values.Statut.trim() || DEFAULT_MISSION_STATUT,
  };

  const prodId = Number.parseInt(values.Produit_SDPC.trim(), 10);
  if (Number.isFinite(prodId) && prodId !== 0) {
    out.Produit_SDPC = prodId;
  }

  return out;
}

export function buildMissionPatch(
  values: MissionFormValues,
  init: MissionFormValues,
): Partial<Omit<Mission, "id">> {
  const out: Record<string, unknown> = {};

  if (values.Nom_de_la_mission.trim() !== init.Nom_de_la_mission.trim()) {
    out.Nom_de_la_mission = values.Nom_de_la_mission.trim();
  }
  if (values.Statut.trim() !== init.Statut.trim()) {
    out.Statut = values.Statut.trim() === "" ? null : values.Statut.trim();
  }

  const vProd = values.Produit_SDPC.trim();
  const iProd = init.Produit_SDPC.trim();
  if (vProd !== iProd) {
    if (vProd === "") {
      out.Produit_SDPC = null;
    } else {
      const n = Number.parseInt(vProd, 10);
      if (Number.isFinite(n)) {
        out.Produit_SDPC = n;
      }
    }
  }

  return out as Partial<Omit<Mission, "id">>;
}
