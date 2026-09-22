import type { Mission } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";

export const DEFAULT_MISSION_STATUT = "A instruire";

export type MissionFormValues = {
  Nom_de_la_mission: string;
  Produit_SDPC: string;
  Statut: string;
  /** Id mission master source (réaffectation d’une prestation existante). */
  missionSource: string;
  /** Id `Missions_enfants` à rattacher au nouveau lot. */
  prestationExistante: string;
  prestationIntervenant: string;
  prestationLibelle: string;
  prestationJoursEnvisages: string;
};

export function emptyMissionCreateForm(): MissionFormValues {
  return {
    Nom_de_la_mission: "",
    Produit_SDPC: "",
    Statut: DEFAULT_MISSION_STATUT,
    missionSource: "",
    prestationExistante: "",
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
    missionSource: "",
    prestationExistante: "",
    prestationIntervenant: "",
    prestationLibelle: "",
    prestationJoursEnvisages: "",
  };
}

/** Id numérique positif depuis une chaîne formulaire, sinon `null`. */
export function parseOptionalPositiveId(raw: string): number | null {
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parcours réaffectation actif si une prestation existante est choisie. */
export function wantsReassignPrestation(values: MissionFormValues): boolean {
  return parseOptionalPositiveId(values.prestationExistante) != null;
}

/** Parcours création neuve actif si un intervenant est choisi (et pas de réaffectation). */
export function wantsCreatePrestation(values: MissionFormValues): boolean {
  if (wantsReassignPrestation(values)) {
    return false;
  }
  return parseOptionalPositiveId(values.prestationIntervenant) != null;
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
