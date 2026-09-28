/**
 * Formulaire drawer CRA fiche mission (modifier / dupliquer).
 * Réutilise les helpers déclaration (mois, jours, champs Realise).
 */

import type { SuiviMensuel } from "../types.ts";
import {
  craDeclarerMonthOptions,
  findExistingRealiseId,
  parseCraDeclarerJours,
} from "./craDeclarer.ts";
import {
  formatGristPeriodeMonthKeyLabel,
  gristPeriodeFilterKey,
} from "./gristPeriode.ts";
import {
  extractGristReferenceId,
  extractSuiviBdcRowRef,
} from "./gristReferences.ts";

export type MissionCraFormValues = {
  monthKey: string;
  nbJours: string;
  taches: string;
  /** Id BDC en string, vide = aucun / détacher. */
  bdcId: string;
};

/** Contexte figé (prestation / intervenant) — hors formulaire éditable. */
export type MissionCraDrawerContext = {
  suivi: SuiviMensuel;
  intervenantId: number;
  missionId: number;
  enfantId: number;
  equipeLabel: string;
  prestationLibelle: string;
  intervenantLibelle: string;
  /** TJM lisible (Admin) — pour estimation TTC. */
  tjm?: number;
  /** Portage (Malt, OCTO…) — affichage. */
  portage?: string;
};

export const MISSION_CRA_MONTH_COLLISION_MESSAGE =
  "Un CRA existe déjà pour ce mois sur cette prestation — ouvrez-le en Modifier.";

export function emptyMissionCraForm(): MissionCraFormValues {
  return { monthKey: "", nbJours: "", taches: "", bdcId: "" };
}

export function suiviToMissionCraFormValues(s: SuiviMensuel): MissionCraFormValues {
  const monthKey = gristPeriodeFilterKey(s.Periode, s) ?? "";
  const bdcRef = extractSuiviBdcRowRef(s as unknown as Record<string, unknown>);
  return {
    monthKey,
    nbJours:
      s.Nb_jours != null && Number.isFinite(s.Nb_jours) ? String(s.Nb_jours) : "",
    taches: s.Taches_realisees?.trim() ?? "",
    bdcId: bdcRef != null && bdcRef > 0 ? String(bdcRef) : "",
  };
}

/**
 * Options mois pour le select : fenêtre déclaration ±6 mois,
 * plus le mois de la ligne s’il sort de la fenêtre.
 */
export function missionCraMonthOptions(
  currentMonthKey: string | undefined,
  now: Date = new Date(),
): { value: string; label: string }[] {
  const base = craDeclarerMonthOptions(now);
  const key = currentMonthKey?.trim() ?? "";
  if (!key) {
    return base;
  }
  if (base.some((o) => o.value === key)) {
    return base;
  }
  return [
    { value: key, label: formatGristPeriodeMonthKeyLabel(key) },
    ...base,
  ];
}

/**
 * Id d’un autre Realise pour (intervenant, prestation, mois), hors `excludeId`.
 * null = pas de collision.
 */
export function findMissionCraMonthCollisionId(
  suivi: SuiviMensuel[],
  intervenantId: number,
  enfantId: number,
  monthKey: string,
  excludeId?: number,
): number | null {
  const existing = findExistingRealiseId(suivi, intervenantId, enfantId, monthKey);
  if (existing == null) {
    return null;
  }
  if (excludeId != null && existing === excludeId) {
    return null;
  }
  return existing;
}

export function resolveMissionCraLinks(s: SuiviMensuel): {
  intervenantId: number | null;
  missionId: number | null;
  enfantId: number | null;
} {
  return {
    intervenantId: extractGristReferenceId(s.Intervenants) ?? null,
    missionId: extractGristReferenceId(s.Missions) ?? null,
    enfantId: extractGristReferenceId(s.Mission_enfant) ?? null,
  };
}

/** Parse jours obligatoires pour le drawer (erreur si vide / invalide). */
export function parseMissionCraJoursRequired(raw: string): number {
  const t = raw.trim();
  if (!t) {
    throw new Error("Indiquez le nombre de jours.");
  }
  const n = parseCraDeclarerJours(raw);
  if (n == null) {
    throw new Error("Indiquez le nombre de jours.");
  }
  return n;
}
