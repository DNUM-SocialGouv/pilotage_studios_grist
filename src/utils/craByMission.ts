import type { MissionEnfant, SuiviMensuel } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import { resolveSuiviMasterMissionId } from "./missionEnfants.ts";
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

export function totauxCraForEnfant(suiviRows: SuiviMensuel[], enfantId: number): CraTotaux {
  let jours = 0;
  let ttc = 0;
  let count = 0;
  for (const row of suiviRows) {
    const id = extractGristReferenceId(row.Mission_enfant);
    if (id !== enfantId) {
      continue;
    }
    count += 1;
    if (typeof row.Nb_jours === "number" && Number.isFinite(row.Nb_jours)) {
      jours += row.Nb_jours;
    }
    ttc += montantTtcLigneSuivi(row);
  }
  return { jours, ttc, count };
}
