import type { Mission, MissionEnfant } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import { missionEnfantLibelle } from "./missionEnfants.ts";
import { missionLibelle } from "./missionsList.ts";

/** Statuts prestation considérés comme terminés / hors « en cours ». */
const PRESTATION_STATUTS_TERMINES = new Set([
  "terminé",
  "termine",
  "clos",
  "clôturé",
  "cloture",
  "clôturée",
  "cloturee",
  "archivé",
  "archive",
]);

export type EquipePrestationRow = {
  enfantId: number;
  missionId: number;
  missionLibelle: string;
  /** Statut de la mission parente (pas de la prestation). */
  missionStatut: string;
  prestationLibelle: string;
  /** Statut de la prestation (filtre en cours / passées). */
  statut: string;
  /** Pour le tri interne uniquement (non affiché). */
  dateDebut: number | undefined;
  enCours: boolean;
};

export type EquipePrestationMissionGroup = {
  missionId: number;
  missionLibelle: string;
  missionStatut: string;
  prestations: EquipePrestationRow[];
};

export type EquipePrestationsFilter = "en-cours" | "toutes";

/**
 * True si la prestation n’est pas terminée / close / archivée / annulée.
 * « En pause », « En projet », « En cours » restent visibles sous le filtre En cours.
 */
export function isPrestationEnCours(statut: string | undefined): boolean {
  const t = statut?.trim().toLowerCase();
  if (!t) {
    return true;
  }
  if (t.includes("annul")) {
    return false;
  }
  return !PRESTATION_STATUTS_TERMINES.has(t);
}

/**
 * Prestations où `Intervenant` = `memberId`, enrichies avec le libellé mission.
 * Tri plat : date début décroissante, puis libellé mission, puis id prestation.
 */
export function buildEquipePrestationRows(
  memberId: number,
  enfants: MissionEnfant[],
  missions: Mission[],
): EquipePrestationRow[] {
  if (!Number.isFinite(memberId) || memberId <= 0) {
    return [];
  }

  const missionsById = new Map(missions.map((m) => [m.id, m]));
  const rows: EquipePrestationRow[] = [];

  for (const enfant of enfants) {
    const intervenantId = extractGristReferenceId(enfant.Intervenant);
    if (intervenantId !== memberId) {
      continue;
    }
    const missionId = extractGristReferenceId(enfant.Mission);
    if (missionId === undefined || missionId === 0) {
      continue;
    }
    const mission = missionsById.get(missionId);
    const statut = enfant.Statut?.trim() || "—";
    rows.push({
      enfantId: enfant.id,
      missionId,
      missionLibelle: mission ? missionLibelle(mission) : `Mission #${missionId}`,
      missionStatut: mission?.Statut?.trim() || "—",
      prestationLibelle: missionEnfantLibelle(enfant),
      statut,
      dateDebut: enfant.Date_de_debut,
      enCours: isPrestationEnCours(enfant.Statut),
    });
  }

  rows.sort((a, b) => {
    const da = a.dateDebut ?? 0;
    const db = b.dateDebut ?? 0;
    if (db !== da) {
      return db - da;
    }
    const byMission = a.missionLibelle.localeCompare(b.missionLibelle, "fr");
    if (byMission !== 0) {
      return byMission;
    }
    return a.enfantId - b.enfantId;
  });

  return rows;
}

export function filterEquipePrestationRows(
  rows: EquipePrestationRow[],
  filter: EquipePrestationsFilter,
): EquipePrestationRow[] {
  if (filter === "toutes") {
    return rows;
  }
  return rows.filter((r) => r.enCours);
}

/**
 * Regroupe les prestations par mission (ordre des groupes = max date début
 * décroissante, puis libellé ; dans un groupe = date décroissante).
 */
export function groupEquipePrestationRowsByMission(
  rows: EquipePrestationRow[],
): EquipePrestationMissionGroup[] {
  const byId = new Map<number, EquipePrestationMissionGroup>();

  for (const row of rows) {
    let group = byId.get(row.missionId);
    if (!group) {
      group = {
        missionId: row.missionId,
        missionLibelle: row.missionLibelle,
        missionStatut: row.missionStatut,
        prestations: [],
      };
      byId.set(row.missionId, group);
    }
    group.prestations.push(row);
  }

  const groups = [...byId.values()];
  for (const g of groups) {
    g.prestations.sort((a, b) => {
      const da = a.dateDebut ?? 0;
      const db = b.dateDebut ?? 0;
      if (db !== da) {
        return db - da;
      }
      return a.enfantId - b.enfantId;
    });
  }

  groups.sort((a, b) => {
    const maxA = Math.max(0, ...a.prestations.map((p) => p.dateDebut ?? 0));
    const maxB = Math.max(0, ...b.prestations.map((p) => p.dateDebut ?? 0));
    if (maxB !== maxA) {
      return maxB - maxA;
    }
    return a.missionLibelle.localeCompare(b.missionLibelle, "fr");
  });

  return groups;
}
