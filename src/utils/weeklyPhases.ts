/**
 * Phases kanban Weekly (satellite `Weekly_phase`) + construction des cartes mission.
 */

import type {
  Intervenant,
  Mission,
  MissionEnfant,
  ProduitSdpc,
  WeeklyPhaseRow,
} from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import { missionDepartementTokens } from "./missionsList.ts";
import { produitDisplayName } from "./produitsList.ts";

export const WEEKLY_PHASE_KEYS = [
  "prochainement",
  "cadrage",
  "actif",
  "autonomie",
] as const;

export type WeeklyPhaseKey = (typeof WEEKLY_PHASE_KEYS)[number];

export type WeeklyPhaseMeta = {
  key: WeeklyPhaseKey;
  label: string;
  /** Pastille en-tête de colonne. */
  dot: string;
  /** Fond de colonne. */
  colBg: string;
};

export const WEEKLY_PHASES: readonly WeeklyPhaseMeta[] = [
  {
    key: "prochainement",
    label: "Prochainement",
    dot: "#e4794a",
    colBg: "#fef4f2",
  },
  {
    key: "cadrage",
    label: "Cadrage",
    dot: "#e1000f",
    colBg: "#fef4f4",
  },
  {
    key: "actif",
    label: "Accompagnement actif",
    dot: "#c3992a",
    colBg: "#fef9ec",
  },
  {
    key: "autonomie",
    label: "Terminé",
    dot: "#18753c",
    colBg: "#f1faf3",
  },
] as const;

export function isWeeklyPhaseKey(value: string | null | undefined): value is WeeklyPhaseKey {
  return WEEKLY_PHASE_KEYS.includes(value as WeeklyPhaseKey);
}

/** Phase stockée, sinon heuristique lecture seule (Terminé → autonomie, sinon prochainement). */
export function resolveWeeklyPhase(
  mission: Mission,
  phaseByMissionId: ReadonlyMap<number, WeeklyPhaseKey>,
): WeeklyPhaseKey {
  const stored = phaseByMissionId.get(mission.id);
  if (stored) {
    return stored;
  }
  const statut = (mission.Statut ?? "").trim().toLowerCase();
  if (statut === "terminé" || statut === "termine") {
    return "autonomie";
  }
  return "prochainement";
}

/**
 * Index phase par mission. Si doublons (courses create), on garde la ligne
 * au **plus petit id** (la plus ancienne) pour stabiliser upserts suivants.
 */
export function phaseRowsToMap(
  rows: readonly WeeklyPhaseRow[],
): Map<number, { phaseId: number; phase: WeeklyPhaseKey }> {
  const map = new Map<number, { phaseId: number; phase: WeeklyPhaseKey }>();
  for (const row of rows) {
    const missionId = extractGristReferenceId(row.Mission);
    if (missionId == null) continue;
    const key = (row.Phase ?? "").trim();
    if (!isWeeklyPhaseKey(key)) continue;
    const existing = map.get(missionId);
    if (existing != null && existing.phaseId <= row.id) continue;
    map.set(missionId, { phaseId: row.id, phase: key });
  }
  return map;
}

export type WeeklyCard = {
  missionId: number;
  titre: string;
  phase: WeeklyPhaseKey;
  /** Id ligne `Weekly_phase` si déjà créée. */
  phaseRowId: number | null;
  statut: string;
  departements: string[];
  produitLabel: string;
  intervenants: string[];
  meteo: string;
};

export function buildWeeklyCards(input: {
  missions: readonly Mission[];
  missionEnfants: readonly MissionEnfant[];
  intervenants: readonly Intervenant[];
  produits: readonly ProduitSdpc[];
  phaseRows: readonly WeeklyPhaseRow[];
}): WeeklyCard[] {
  const phaseMap = phaseRowsToMap(input.phaseRows);
  const phaseByMission = new Map<number, WeeklyPhaseKey>();
  for (const [id, v] of phaseMap) {
    phaseByMission.set(id, v.phase);
  }

  const equipeById = new Map(
    input.intervenants.map((p) => [p.id, (p.Prenom_Nom ?? "").trim()] as const),
  );
  const produitById = new Map(input.produits.map((p) => [p.id, p] as const));

  const intervenantsByMission = new Map<number, string[]>();
  for (const enfant of input.missionEnfants) {
    const parentId = extractGristReferenceId(enfant.Mission);
    if (parentId == null) continue;
    const intervenantId = extractGristReferenceId(enfant.Intervenant);
    const name =
      intervenantId != null ? equipeById.get(intervenantId) : undefined;
    if (!name) continue;
    const list = intervenantsByMission.get(parentId) ?? [];
    if (!list.includes(name)) {
      list.push(name);
    }
    intervenantsByMission.set(parentId, list);
  }

  return input.missions
    .map((m) => {
      const stored = phaseMap.get(m.id);
      const produitId = extractGristReferenceId(m.Produit_SDPC);
      const produit = produitId != null ? produitById.get(produitId) : undefined;
      return {
        missionId: m.id,
        titre: (m.Nom_de_la_mission ?? "").trim() || `Mission #${m.id}`,
        phase: resolveWeeklyPhase(m, phaseByMission),
        phaseRowId: stored?.phaseId ?? null,
        statut: (m.Statut ?? "").trim(),
        departements: missionDepartementTokens(m),
        produitLabel: produit ? produitDisplayName(produit) : "",
        intervenants: intervenantsByMission.get(m.id) ?? [],
        meteo: (m.Meteo ?? "").trim(),
      } satisfies WeeklyCard;
    })
    .sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
}

export function groupCardsByPhase(
  cards: readonly WeeklyCard[],
): Record<WeeklyPhaseKey, WeeklyCard[]> {
  const out: Record<WeeklyPhaseKey, WeeklyCard[]> = {
    prochainement: [],
    cadrage: [],
    actif: [],
    autonomie: [],
  };
  for (const card of cards) {
    out[card.phase].push(card);
  }
  return out;
}
