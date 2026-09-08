import type { MissionEnfant, SuiviMensuel } from "../types.ts";
import { asGristChoice, extractGristReferenceId, extractGristReferenceIds } from "./gristReferences.ts";

/**
 * Colonnes Grist `Missions_enfants` → champs internes.
 * Actuel : `Mission_parent` / `Mission_enfant` (texte). Legacy : `Mission` / `Libelle`.
 */
function textLibelleFromGrist(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  // Un id numérique n’est pas un libellé (homonyme `Realise.Mission_enfant`).
  if (typeof value === "number") {
    return undefined;
  }
  return asGristChoice(value);
}

export function missionEnfantFromGrist(record: Record<string, unknown>): Pick<
  MissionEnfant,
  "Mission" | "Libelle"
> {
  return {
    Mission: record.Mission_parent ?? record.Mission,
    Libelle: textLibelleFromGrist(record.Mission_enfant) ?? textLibelleFromGrist(record.Libelle),
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

/** Libellé lisible de `Type_prestation` (clé Grist → texte UI). */
export function typePrestationLabel(raw: string | undefined): string {
  const t = raw?.trim();
  if (t === "Entreprise_forfait") {
    return "Entreprise (forfait)";
  }
  if (t === "Freelance_jours" || !t) {
    return "Freelance";
  }
  return t;
}

/**
 * Titre + hint intervenant pour une sous-ligne expand (liste missions).
 * Hint seulement si l’intervenant est renseigné et distinct du libellé.
 */
export function enfantExpandPrimary(
  enfant: MissionEnfant,
  intervenantLabel?: string,
): { primary: string; hint?: string } {
  const lib = enfant.Libelle?.trim();
  const primary = lib || "—";
  const iv = intervenantLabel?.trim();
  const hint = iv && iv !== primary ? iv : undefined;
  return hint ? { primary, hint } : { primary };
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
