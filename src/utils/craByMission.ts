import type { MissionEnfant, SuiviMensuel } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import {
  resolveSuiviMasterMissionId,
  suiviBelongsToMasterMission,
} from "./missionEnfants.ts";
import { type CraTotaux, montantTtcLigneSuivi } from "./suiviMensuel.ts";

/**
 * Totaux jours + TTC + nb de lignes CRA agrégés par id de mission master
 * (`Mission_enfant` → parent, sinon `Missions`).
 */
export function aggregateCraByMissionId(
  suiviRows: SuiviMensuel[],
  enfants: MissionEnfant[] = [],
): Map<number, CraTotaux> {
  const enfantsById = new Map(enfants.map((e) => [e.id, e]));
  const map = new Map<number, CraTotaux>();
  for (const row of suiviRows) {
    const mid = resolveSuiviMasterMissionId(row, enfantsById);
    if (mid == null || mid === 0) {
      continue;
    }
    const prev = map.get(mid) ?? { jours: 0, ttc: 0, count: 0 };
    const j =
      typeof row.Nb_jours === "number" && Number.isFinite(row.Nb_jours) ? row.Nb_jours : 0;
    map.set(mid, {
      jours: prev.jours + j,
      ttc: prev.ttc + montantTtcLigneSuivi(row),
      count: prev.count + 1,
    });
  }
  return map;
}

/**
 * Totaux jours + TTC + nb de lignes CRA par id de prestation
 * (`Realise.Mission_enfant` = ref, pas le texte `Missions_enfants.Mission_enfant`).
 */
export function aggregateCraByEnfantId(suiviRows: SuiviMensuel[]): Map<number, CraTotaux> {
  const map = new Map<number, CraTotaux>();
  for (const row of suiviRows) {
    const enfantId = extractGristReferenceId(row.Mission_enfant);
    if (enfantId == null || enfantId === 0) {
      continue;
    }
    const prev = map.get(enfantId) ?? { jours: 0, ttc: 0, count: 0 };
    const j =
      typeof row.Nb_jours === "number" && Number.isFinite(row.Nb_jours) ? row.Nb_jours : 0;
    map.set(enfantId, {
      jours: prev.jours + j,
      ttc: prev.ttc + montantTtcLigneSuivi(row),
      count: prev.count + 1,
    });
  }
  return map;
}

export function totauxCraForEnfant(suiviRows: SuiviMensuel[], enfantId: number): CraTotaux {
  return aggregateCraByEnfantId(suiviRows).get(enfantId) ?? { jours: 0, ttc: 0, count: 0 };
}

/** Lignes CRA groupées par id de prestation (`Mission_enfant`). Sans ref → ignorées. */
export function groupSuiviRowsByEnfantId(
  suiviRows: SuiviMensuel[],
): Map<number, SuiviMensuel[]> {
  const map = new Map<number, SuiviMensuel[]>();
  for (const row of suiviRows) {
    const enfantId = extractGristReferenceId(row.Mission_enfant);
    if (enfantId == null || enfantId === 0) {
      continue;
    }
    const list = map.get(enfantId) ?? [];
    list.push(row);
    map.set(enfantId, list);
  }
  return map;
}

/**
 * TTC des CRA du master **hors** prestations enfants du jeu fourni
 * (pas de `Mission_enfant`, ou enfant absent de `enfants` — typiquement legacy).
 */
export function sumSuiviTtcHorsPrestationForMission(
  suiviRows: SuiviMensuel[],
  missionId: number,
  enfants: MissionEnfant[] = [],
): number {
  const enfantsById = new Map(enfants.map((e) => [e.id, e]));
  let sum = 0;
  for (const row of suiviRows) {
    if (!suiviBelongsToMasterMission(row, missionId, enfantsById)) {
      continue;
    }
    const enfantId = extractGristReferenceId(row.Mission_enfant);
    if (enfantId != null && enfantId !== 0 && enfantsById.has(enfantId)) {
      continue;
    }
    sum += montantTtcLigneSuivi(row);
  }
  return sum;
}
