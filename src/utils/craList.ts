import type { Mission, MissionEnfant, SuiviMensuel } from "../types.ts";
import {
  extractGristReferenceId,
  extractProduitRefFromSuivi,
  extractSuiviBdcRowRef,
} from "./gristReferences.ts";
import {
  formatGristPeriodeMoisAnnee,
  formatGristPeriodeMonthKeyLabel,
  gristPeriodeFilterKey,
} from "./gristPeriode.ts";
import { missionEnfantLibelle, resolveSuiviMasterMissionId } from "./missionEnfants.ts";
import { labelIntervenantSuivi, labelProduitSuivi } from "./suiviLabels.ts";
import { montantTtcLigneSuivi } from "./suiviMensuel.ts";

export type CraListFilters = {
  periode: string;
  equipe: string;
  intervenantId: string;
  produitId: string;
  bdcId: string;
};

export function defaultCraOrder(a: SuiviMensuel, b: SuiviMensuel): number {
  const keyA = gristPeriodeFilterKey(a.Periode, a) ?? "";
  const keyB = gristPeriodeFilterKey(b.Periode, b) ?? "";
  const cmpPeriode = keyB.localeCompare(keyA);
  if (cmpPeriode !== 0) {
    return cmpPeriode;
  }
  return b.id - a.id;
}

export function craPeriodeOptions(rows: SuiviMensuel[]): { value: string; label: string }[] {
  const byKey = new Map<string, string>();
  for (const s of rows) {
    const key = gristPeriodeFilterKey(s.Periode, s);
    if (!key) {
      continue;
    }
    byKey.set(key, formatGristPeriodeMoisAnnee(s.Periode, s));
  }
  return Array.from(byKey.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([value, label]) => ({ value, label: label || formatGristPeriodeMonthKeyLabel(value) }));
}

export function craEquipeOptions(rows: SuiviMensuel[]): string[] {
  const set = new Set<string>();
  for (const s of rows) {
    const e = s.Equipe?.trim();
    if (e) {
      set.add(e);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

export function filterCraRows(rows: SuiviMensuel[], filters: CraListFilters): SuiviMensuel[] {
  const periode = filters.periode.trim();
  const equipe = filters.equipe.trim();
  const intervenantId = filters.intervenantId.trim();
  const produitId = filters.produitId.trim();
  const bdcId = filters.bdcId.trim();

  return rows.filter((s) => {
    if (periode) {
      const key = gristPeriodeFilterKey(s.Periode, s);
      if (key !== periode) {
        return false;
      }
    }
    if (equipe && s.Equipe?.trim() !== equipe) {
      return false;
    }
    if (intervenantId) {
      const id = extractGristReferenceId(s.Intervenants);
      if (String(id ?? "") !== intervenantId) {
        return false;
      }
    }
    if (produitId) {
      const id = extractProduitRefFromSuivi(s as unknown as Record<string, unknown>);
      if (String(id ?? "") !== produitId) {
        return false;
      }
    }
    if (bdcId) {
      const id = extractSuiviBdcRowRef(s as unknown as Record<string, unknown>);
      if (String(id ?? "") !== bdcId) {
        return false;
      }
    }
    return true;
  });
}

export function labelMissionCra(
  s: SuiviMensuel,
  missionsById: Map<number, string>,
  enfantsById: Map<number, MissionEnfant>,
  intervenantsById: Map<number, string>,
): string {
  const enfantId = extractGristReferenceId(s.Mission_enfant);
  if (enfantId != null && enfantId !== 0) {
    const enfant = enfantsById.get(enfantId);
    if (enfant) {
      const masterId = resolveSuiviMasterMissionId(s, enfantsById);
      const masterNom =
        masterId != null ? (missionsById.get(masterId) ?? `Mission #${masterId}`) : "Mission";
      const ivRef = extractGristReferenceId(enfant.Intervenant);
      const ivLabel =
        ivRef != null && ivRef !== 0 ? intervenantsById.get(ivRef) : undefined;
      return `${masterNom} — ${missionEnfantLibelle(enfant, ivLabel)}`;
    }
    return `Prestation #${enfantId}`;
  }
  const mid = extractGristReferenceId(s.Missions);
  if (mid == null || mid === 0) {
    return "—";
  }
  return missionsById.get(mid) ?? `Mission #${mid}`;
}

export function labelBdcCra(s: SuiviMensuel, bdcById: Map<number, string>): string {
  const bid = extractSuiviBdcRowRef(s as unknown as Record<string, unknown>);
  if (bid === undefined) {
    const nom = s.Nom_BdC?.trim();
    return nom || "—";
  }
  return bdcById.get(bid) ?? `BDC #${bid}`;
}

export function craTotauxFiltres(rows: SuiviMensuel[]): {
  count: number;
  jours: number;
  ttc: number;
} {
  let jours = 0;
  let ttc = 0;
  for (const s of rows) {
    const j = typeof s.Nb_jours === "number" && Number.isFinite(s.Nb_jours) ? s.Nb_jours : 0;
    jours += j;
    ttc += montantTtcLigneSuivi(s);
  }
  return { count: rows.length, jours, ttc };
}

export function missionsByIdFromRows(missions: Mission[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const m of missions) {
    map.set(m.id, m.Nom_de_la_mission?.trim() || `Mission #${m.id}`);
  }
  return map;
}

export {
  formatGristPeriodeMoisAnnee,
  labelIntervenantSuivi,
  labelProduitSuivi,
  extractSuiviBdcRowRef,
  resolveSuiviMasterMissionId,
};
