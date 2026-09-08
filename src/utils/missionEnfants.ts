import type { MissionEnfant, SuiviMensuel } from "../types.ts";
import { asGristChoice, extractGristReferenceId, extractGristReferenceIds } from "./gristReferences.ts";

/**
 * Colonnes Grist `Missions_enfants` → champs internes.
 * Actuel : `Mission_parent` / `Mission_enfant` (texte). Legacy : `Mission` / `Libelle`.
 */
export function missionEnfantFromGrist(record: Record<string, unknown>): Pick<
  MissionEnfant,
  "Mission" | "Libelle"
> {
  const libelleRaw = record.Mission_enfant ?? record.Libelle;
  const libelle =
    (typeof libelleRaw === "string" ? libelleRaw : undefined) ??
    (typeof libelleRaw === "number" && Number.isFinite(libelleRaw) ? String(libelleRaw) : undefined) ??
    asGristChoice(libelleRaw);
  return {
    Mission: record.Mission_parent ?? record.Mission,
    Libelle: libelle,
  };
}

export function missionEnfantLibelle(enfant: MissionEnfant, intervenantLabel?: string): string {
  const lib = enfant.Libelle?.trim();
  if (lib) {
    return lib;
  }
  if (intervenantLabel?.trim()) {
    return intervenantLabel.trim();
  }
  return `Prestation #${enfant.id}`;
}

/** Id master résolu depuis une ligne CRA : `Mission_enfant` prioritaire, sinon `Missions`. */
export function resolveSuiviMasterMissionId(
  row: SuiviMensuel,
  enfantsById: Map<number, MissionEnfant>,
): number | undefined {
  const enfantId = extractGristReferenceId(row.Mission_enfant);
  if (enfantId != null && enfantId !== 0) {
    const enfant = enfantsById.get(enfantId);
    const masterId = enfant ? extractGristReferenceId(enfant.Mission) : undefined;
    if (masterId != null && masterId !== 0) {
      return masterId;
    }
  }
  const legacy = extractGristReferenceId(row.Missions);
  return legacy != null && legacy !== 0 ? legacy : undefined;
}

export function suiviBelongsToMasterMission(
  row: SuiviMensuel,
  masterId: number,
  enfantsById: Map<number, MissionEnfant>,
): boolean {
  return resolveSuiviMasterMissionId(row, enfantsById) === masterId;
}

export function enfantsOfMaster(enfants: MissionEnfant[], masterId: number): MissionEnfant[] {
  return enfants.filter((e) => extractGristReferenceId(e.Mission) === masterId);
}

/** Ids intervenants staffés via les enfants du master (+ legacy `Intervenants` si fourni). */
export function intervenantIdsForMaster(
  enfants: MissionEnfant[],
  masterId: number,
  legacyIntervenants?: unknown,
): number[] {
  const ids = new Set<number>();
  for (const e of enfantsOfMaster(enfants, masterId)) {
    const iid = extractGristReferenceId(e.Intervenant);
    if (iid != null && iid !== 0) {
      ids.add(iid);
    }
  }
  for (const id of extractGristReferenceIds(legacyIntervenants)) {
    if (id !== 0) {
      ids.add(id);
    }
  }
  return [...ids];
}
