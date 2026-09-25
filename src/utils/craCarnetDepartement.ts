/**
 * Helpers « Mon carnet » manager — missions via prestations du département.
 *
 * Une mission remonte si ≥ 1 prestation dont l’intervenant a le même
 * `Equipe.Equipe` que le viewer (missions mixtes incluses).
 */

import type { Intervenant, Mission, MissionEnfant } from "../types.ts";
import { normalizeEquipeLabel } from "./craRevueEquipe.ts";
import { extractGristReferenceId } from "./gristReferences.ts";
import {
  groupEquipePrestationRowsByMission,
  isPrestationEnCours,
  type EquipePrestationMissionGroup,
  type EquipePrestationRow,
  type EquipePrestationsFilter,
} from "./equipeMemberPrestations.ts";
import { missionEnfantLibelle } from "./missionEnfants.ts";
import { missionLibelle } from "./missionsList.ts";

export type CarnetDepartementPrestationRow = EquipePrestationRow & {
  /** Nom de l’intervenant (si connu). */
  intervenantNom: string;
  intervenantId: number;
};

export type CarnetDepartementMissionGroup = Omit<
  EquipePrestationMissionGroup,
  "prestations"
> & {
  prestations: CarnetDepartementPrestationRow[];
};

/**
 * Prestations dont l’intervenant appartient au département viewer.
 * Département vide → liste vide.
 */
export function buildCarnetDepartementPrestationRows(
  viewerDepartement: string,
  enfants: MissionEnfant[],
  missions: Mission[],
  intervenants: Intervenant[],
): CarnetDepartementPrestationRow[] {
  const dept = normalizeEquipeLabel(viewerDepartement);
  if (!dept) {
    return [];
  }

  const equipeByIntervenantId = new Map<number, string>();
  const nomByIntervenantId = new Map<number, string>();
  for (const iv of intervenants) {
    equipeByIntervenantId.set(iv.id, normalizeEquipeLabel(iv.Equipe));
    nomByIntervenantId.set(
      iv.id,
      iv.Prenom_Nom?.trim() || `Intervenant #${iv.id}`,
    );
  }

  const missionsById = new Map(missions.map((m) => [m.id, m]));
  const rows: CarnetDepartementPrestationRow[] = [];

  for (const enfant of enfants) {
    const intervenantId = extractGristReferenceId(enfant.Intervenant);
    if (intervenantId === undefined || intervenantId === 0) {
      continue;
    }
    if (equipeByIntervenantId.get(intervenantId) !== dept) {
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
      intervenantId,
      intervenantNom: nomByIntervenantId.get(intervenantId) ?? `Intervenant #${intervenantId}`,
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

export function filterCarnetDepartementRows(
  rows: CarnetDepartementPrestationRow[],
  filter: EquipePrestationsFilter,
): CarnetDepartementPrestationRow[] {
  if (filter === "toutes") {
    return rows;
  }
  return rows.filter((r) => r.enCours);
}

/** Groupes mission pour le carnet manager (prestations du département uniquement). */
export function craCarnetDepartementGroups(
  viewerDepartement: string,
  enfants: MissionEnfant[],
  missions: Mission[],
  intervenants: Intervenant[],
  filter: EquipePrestationsFilter = "en-cours",
): CarnetDepartementMissionGroup[] {
  const rows = filterCarnetDepartementRows(
    buildCarnetDepartementPrestationRows(
      viewerDepartement,
      enfants,
      missions,
      intervenants,
    ),
    filter,
  );
  return groupEquipePrestationRowsByMission(rows) as CarnetDepartementMissionGroup[];
}
