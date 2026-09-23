import type { MissionEnfant } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import {
  missionEnfantLibelleWriteField,
  missionEnfantParentWriteField,
} from "./missionEnfants.ts";

export const DEFAULT_MISSION_ENFANT_STATUT = "En cours";
export const DEFAULT_MISSION_ENFANT_TYPE = "Freelance_jours";

export type MissionEnfantFormValues = {
  Libelle: string;
  Intervenant: string;
  Jours_envisages: string;
  Statut: string;
  /** `YYYY-MM-DD` pour `<input type="date">`, ou vide. */
  Date_de_debut: string;
};

/** Timestamp Grist (secondes) → valeur input date locale. */
export function gristTimestampToDateInput(timestamp: number | undefined | null): string {
  if (timestamp == null || timestamp === 0 || !Number.isFinite(timestamp)) {
    return "";
  }
  const d = new Date(timestamp * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Valeur input date → timestamp Grist (secondes, minuit local), ou `null` si vide / invalide. */
export function dateInputToGristTimestamp(value: string): number | null {
  const t = value.trim();
  if (!t) {
    return null;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) {
    return null;
  }
  const year = Number.parseInt(m[1]!, 10);
  const month = Number.parseInt(m[2]!, 10);
  const day = Number.parseInt(m[3]!, 10);
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return Math.floor(d.getTime() / 1000);
}

export function emptyMissionEnfantForm(): MissionEnfantFormValues {
  return {
    Libelle: "",
    Intervenant: "",
    Jours_envisages: "",
    Statut: DEFAULT_MISSION_ENFANT_STATUT,
    Date_de_debut: "",
  };
}

export function missionEnfantToFormValues(e: MissionEnfant): MissionEnfantFormValues {
  const iv = extractGristReferenceId(e.Intervenant);
  return {
    Libelle: e.Libelle?.trim() ?? "",
    Intervenant: iv != null && iv !== 0 ? String(iv) : "",
    Jours_envisages:
      typeof e.Jours_envisages === "number" && Number.isFinite(e.Jours_envisages)
        ? String(e.Jours_envisages)
        : "",
    Statut: e.Statut?.trim() || DEFAULT_MISSION_ENFANT_STATUT,
    Date_de_debut: gristTimestampToDateInput(e.Date_de_debut),
  };
}

function parseJoursEnvisages(raw: string): number | undefined {
  const t = raw.trim().replace(",", ".");
  if (!t) {
    return undefined;
  }
  const n = Number.parseFloat(t);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export type BuildMissionEnfantCreateArgs = {
  masterId: number;
  values: MissionEnfantFormValues;
  /** Libellé fallback si `values.Libelle` vide (typiquement le nom intervenant). */
  intervenantLabel?: string;
};

/** Champs create — `Type_prestation` toujours Freelance ; pas de date de fin. */
export function buildMissionEnfantCreateFields(
  args: BuildMissionEnfantCreateArgs,
): Partial<Omit<MissionEnfant, "id">> & {
  Mission_parent: number;
  Titre_de_la_prestation: string;
} {
  const intervenantId = Number.parseInt(args.values.Intervenant.trim(), 10);
  const ivLabel = args.intervenantLabel?.trim() ?? "";
  const libelle =
    args.values.Libelle.trim() || ivLabel || "Prestation";
  const jours = parseJoursEnvisages(args.values.Jours_envisages);
  const dateDebut = dateInputToGristTimestamp(args.values.Date_de_debut);

  const out: Partial<Omit<MissionEnfant, "id">> & {
    Mission_parent: number;
    Titre_de_la_prestation: string;
  } = {
    ...missionEnfantParentWriteField(args.masterId),
    ...missionEnfantLibelleWriteField(libelle),
    Type_prestation: DEFAULT_MISSION_ENFANT_TYPE,
    Statut: args.values.Statut.trim() || DEFAULT_MISSION_ENFANT_STATUT,
  };

  if (Number.isFinite(intervenantId) && intervenantId !== 0) {
    out.Intervenant = intervenantId;
  }
  if (jours != null) {
    out.Jours_envisages = jours;
  }
  if (dateDebut != null) {
    out.Date_de_debut = dateDebut;
  }

  return out;
}

/**
 * Réaffectation migration : seul `Mission_parent` change.
 * Ne pas utiliser dans le drawer edit prestation (parent figé hors create mission).
 */
export function buildMissionEnfantReassignParentFields(masterId: number): {
  Mission_parent: number;
} {
  return missionEnfantParentWriteField(masterId);
}

/**
 * Patch différentiel — n’inclut jamais `Type_prestation` ni `Mission_parent`.
 * Clear date / jours → `null` pour Grist.
 */
export function buildMissionEnfantPatch(
  values: MissionEnfantFormValues,
  init: MissionEnfantFormValues,
  intervenantLabel?: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const ivLabel = intervenantLabel?.trim() ?? "";

  if (values.Libelle.trim() !== init.Libelle.trim()) {
    const libelle = values.Libelle.trim() || ivLabel || "Prestation";
    Object.assign(out, missionEnfantLibelleWriteField(libelle));
  }

  if (values.Intervenant.trim() !== init.Intervenant.trim()) {
    const t = values.Intervenant.trim();
    if (t === "") {
      out.Intervenant = null;
    } else {
      const n = Number.parseInt(t, 10);
      if (Number.isFinite(n)) {
        out.Intervenant = n;
      }
    }
  }

  if (values.Statut.trim() !== init.Statut.trim()) {
    out.Statut = values.Statut.trim() === "" ? null : values.Statut.trim();
  }

  if (values.Jours_envisages.trim() !== init.Jours_envisages.trim()) {
    const jours = parseJoursEnvisages(values.Jours_envisages);
    out.Jours_envisages = jours ?? null;
  }

  if (values.Date_de_debut.trim() !== init.Date_de_debut.trim()) {
    out.Date_de_debut = dateInputToGristTimestamp(values.Date_de_debut);
  }

  return out;
}

