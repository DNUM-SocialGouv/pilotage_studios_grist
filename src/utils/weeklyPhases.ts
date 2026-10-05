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
 * Colonnes ops `Weekly_phase.Meteo` · `Note_ops` · `Membre_equipe` — confirmées
 * MCP 2026-10-05 (doc `nei9DeARs5Eo`). Écriture drawer active.
 * Pas d’écriture vers `Missions`.
 */
export const WEEKLY_PHASE_OPS_COLUMNS_READY = true;

/**
 * Choix météo ops V1 — libellés métier stockés dans `Weekly_phase.Meteo` (TEXT).
 * Pas `Missions.Meteo`. UI = 3 boutons (soleil / nuage / orage).
 */
export const WEEKLY_METEO_OPTIONS = [
  {
    value: "Au vert",
    label: "Au vert",
    iconClass: "fr-icon-sun-line",
    tone: "vert",
  },
  {
    value: "À surveiller",
    label: "À surveiller",
    iconClass: "fr-icon-cloudy-2-line",
    tone: "surveiller",
  },
  {
    value: "En difficulté",
    label: "En difficulté",
    iconClass: "fr-icon-thunderstorms-line",
    tone: "difficulte",
  },
] as const;

export type WeeklyMeteoChoice = (typeof WEEKLY_METEO_OPTIONS)[number]["value"];

/** Valeurs stockées (libellés métier). */
export const WEEKLY_METEO_CHOICES: readonly WeeklyMeteoChoice[] =
  WEEKLY_METEO_OPTIONS.map((o) => o.value);

/**
 * Normalise une valeur lue (libellés métier ou anciens Calme/Nuageux/Orageux).
 * Chaîne vide / inconnue → "".
 */
export function normalizeWeeklyMeteo(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  for (const opt of WEEKLY_METEO_OPTIONS) {
    if (opt.value === t) return opt.value;
  }
  const lower = t.toLowerCase();
  if (
    lower === "calme" ||
    lower.includes("vert") ||
    lower.includes("soleil") ||
    lower.includes("beau")
  ) {
    return "Au vert";
  }
  if (
    lower === "nuageux" ||
    lower.includes("surveill") ||
    lower.includes("nuage") ||
    lower.includes("attention")
  ) {
    return "À surveiller";
  }
  if (
    lower === "orageux" ||
    lower.includes("difficul") ||
    lower.includes("orage") ||
    lower.includes("bloq")
  ) {
    return "En difficulté";
  }
  return t;
}

export function weeklyMeteoIconClass(meteo: string): string {
  const n = normalizeWeeklyMeteo(meteo);
  const opt = WEEKLY_METEO_OPTIONS.find((o) => o.value === n);
  return opt?.iconClass ?? "fr-icon-cloudy-2-line";
}

export function weeklyMeteoLabel(meteo: string): string {
  const n = normalizeWeeklyMeteo(meteo);
  return n || meteo.trim();
}

/** Tone CSS pour badge météo carte (variante A). */
export function weeklyMeteoTone(
  meteo: string,
): "vert" | "surveiller" | "difficulte" | null {
  const n = normalizeWeeklyMeteo(meteo);
  const opt = WEEKLY_METEO_OPTIONS.find((o) => o.value === n);
  return opt?.tone ?? null;
}

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
  /** Id `Equipe` via `Weekly_phase.Membre_equipe` (0 / vide → null). */
  membreEquipeId: number | null;
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
    const membreRaw = extractGristReferenceId(row.Membre_equipe);
    const membreEquipeId =
      WEEKLY_PHASE_OPS_COLUMNS_READY &&
      membreRaw != null &&
      membreRaw > 0
        ? membreRaw
        : null;
    map.set(missionId, {
      phaseId: row.id,
      phase: key,
      meteo: WEEKLY_PHASE_OPS_COLUMNS_READY
        ? normalizeWeeklyMeteo(row.Meteo)
        : "",
      noteOps: WEEKLY_PHASE_OPS_COLUMNS_READY ? (row.Note_ops ?? "").trim() : "",
      membreEquipeId,
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
  /** Météo ops satellite (`Weekly_phase.Meteo`). */
  meteo: string;
  noteOps: string;
  /** Ref `Equipe` (`Weekly_phase.Membre_equipe`). */
  membreEquipeId: number | null;
  /** Libellé affiché (Prenom_Nom) si résolu. */
  membreEquipeLabel: string;
  /** Seed `Equipe.Avatar` pour EquipeAvatar. */
  membreEquipeAvatar: string;
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
    input.intervenants.map(
      (p) =>
        [
          p.id,
          {
            name: (p.Prenom_Nom ?? "").trim(),
            avatar: (p.Avatar ?? "").trim(),
          },
        ] as const,
    ),
  );
  const produitById = new Map(input.produits.map((p) => [p.id, p] as const));

  const intervenantsByMission = new Map<number, string[]>();
  for (const enfant of input.missionEnfants) {
    const parentId = extractGristReferenceId(enfant.Mission);
    if (parentId == null) continue;
    const intervenantId = extractGristReferenceId(enfant.Intervenant);
    const name =
      intervenantId != null ? equipeById.get(intervenantId)?.name : undefined;
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
      const membre =
        stored?.membreEquipeId != null
          ? equipeById.get(stored.membreEquipeId)
          : undefined;
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
        membreEquipeId: stored?.membreEquipeId ?? null,
        membreEquipeLabel: membre?.name ?? "",
        membreEquipeAvatar: membre?.avatar ?? "",
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
