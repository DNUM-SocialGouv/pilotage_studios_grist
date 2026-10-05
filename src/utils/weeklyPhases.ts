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

/**
 * Colonnes ops `Weekly_phase.Meteo` · `Note_ops` · `Coach` — **absentes** au
 * 2026-10-05 (schéma MCP : uniquement `Mission` + `Phase`).
 * Owner UI Grist uniquement (pas d’API schéma / ACL). Passer à `true` après pose.
 * Tant que `false` : drawer en stub (pas d’écriture vers `Missions`).
 */
export const WEEKLY_PHASE_OPS_COLUMNS_READY = false;

/** Choix météo ops V1 (satellite `Weekly_phase.Meteo` — pas `Missions.Meteo`). */
export const WEEKLY_METEO_CHOICES = ["Calme", "Nuageux", "Orageux"] as const;
export type WeeklyMeteoChoice = (typeof WEEKLY_METEO_CHOICES)[number];

export type WeeklyPhaseMeta = {
  key: WeeklyPhaseKey;
  label: string;
  /** Pastille en-tête de colonne. */
  dot: string;
  /** Fond de colonne. */
  colBg: string;
};

/** Tokens DSFR (clair / sombre) — pas de hex figés qui cassent le thème sombre. */
export const WEEKLY_PHASES: readonly WeeklyPhaseMeta[] = [
  {
    key: "prochainement",
    label: "Prochainement",
    dot: "var(--text-label-orange-terre-battue)",
    colBg: "var(--background-contrast-orange-terre-battue)",
  },
  {
    key: "cadrage",
    label: "Cadrage",
    dot: "var(--text-label-red-marianne)",
    colBg: "var(--background-contrast-red-marianne)",
  },
  {
    key: "actif",
    label: "Accompagnement actif",
    dot: "var(--text-label-yellow-tournesol)",
    colBg: "var(--background-contrast-yellow-tournesol)",
  },
  {
    key: "autonomie",
    label: "Terminé",
    dot: "var(--text-label-green-emeraude)",
    colBg: "var(--background-contrast-green-emeraude)",
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
export type WeeklyPhaseStored = {
  phaseId: number;
  phase: WeeklyPhaseKey;
  meteo: string;
  noteOps: string;
  coach: string;
};

export function phaseRowsToMap(
  rows: readonly WeeklyPhaseRow[],
): Map<number, WeeklyPhaseStored> {
  const map = new Map<number, WeeklyPhaseStored>();
  for (const row of rows) {
    const missionId = extractGristReferenceId(row.Mission);
    if (missionId == null) continue;
    const key = (row.Phase ?? "").trim();
    if (!isWeeklyPhaseKey(key)) continue;
    const existing = map.get(missionId);
    if (existing != null && existing.phaseId <= row.id) continue;
    map.set(missionId, {
      phaseId: row.id,
      phase: key,
      meteo: WEEKLY_PHASE_OPS_COLUMNS_READY ? (row.Meteo ?? "").trim() : "",
      noteOps: WEEKLY_PHASE_OPS_COLUMNS_READY ? (row.Note_ops ?? "").trim() : "",
      coach: WEEKLY_PHASE_OPS_COLUMNS_READY ? (row.Coach ?? "").trim() : "",
    });
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
  /** Météo ops satellite (`Weekly_phase.Meteo`) — vide si colonnes non posées. */
  meteo: string;
  noteOps: string;
  coach: string;
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
        // Suivi ops = satellite Weekly uniquement (pas `Missions.Meteo`).
        meteo: stored?.meteo ?? "",
        noteOps: stored?.noteOps ?? "",
        coach: stored?.coach ?? "",
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
