import type { Mission, MissionEnfant, ProduitSdpc, SuiviMensuel } from "../types.ts";
import { extractGristReferenceId, extractGristStringTokens } from "./gristReferences.ts";
import { intervenantIdsForMaster } from "./missionEnfants.ts";
import { libelleProduitGrist } from "./pilotageProduits.ts";

export function missionLibelle(m: Mission): string {
  return m.Nom_de_la_mission?.trim() || `Mission #${m.id}`;
}

export function libelleProduitMission(m: Mission, produitsById: Map<number, string>): string {
  const ref = extractGristReferenceId(m.Produit_SDPC);
  if (ref === undefined || ref === 0) {
    return "—";
  }
  return produitsById.get(ref) ?? libelleProduitGrist({}, ref);
}

export function libelleParRefsIds(ids: number[], byId: Map<number, string>): string {
  if (ids.length === 0) {
    return "—";
  }
  return ids.map((id) => byId.get(id) ?? `#${id}`).join(", ");
}

export function produitsByIdFromRows(produits: ProduitSdpc[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const p of produits) {
    map.set(p.id, libelleProduitGrist(p as unknown as Record<string, unknown>, p.id));
  }
  return map;
}

/** Filtre staffing : lots avec/sans prestation, ou CRA hors prestation. */
export type MissionsStaffingFilter =
  | ""
  | "avec-prestation"
  | "sans-prestation"
  | "cra-hors-prestation";

export type MissionsListFilters = {
  search: string;
  equipe: string;
  statut: string[];
  departement: string;
  produitIds: string[];
  intervenantIds: string[];
  staffing?: MissionsStaffingFilter;
};

export function missionDepartementTokens(m: Mission): string[] {
  return extractGristStringTokens(m.Departement);
}

export type MissionMatchesFiltersOptions = {
  enfantsByMaster?: Map<number, MissionEnfant[]>;
  /** Requis pour le filtre `cra-hors-prestation`. */
  suiviRows?: SuiviMensuel[];
  /** Si true, le filtre CRA hors prestation laisse passer (chargement / erreur). */
  staffingCraPending?: boolean;
  sumHorsPrestationTtc?: (
    suiviRows: SuiviMensuel[],
    missionId: number,
    enfants: MissionEnfant[],
  ) => number;
};

export function missionMatchesFilters(
  m: Mission,
  filters: MissionsListFilters,
  produitsById: Map<number, string>,
  missionEnfants: MissionEnfant[],
  options: MissionMatchesFiltersOptions = {},
): boolean {
  if (filters.statut.length > 0) {
    const st = m.Statut?.trim() ?? "";
    if (!filters.statut.includes(st)) {
      return false;
    }
  }
  if (filters.equipe && !extractGristStringTokens(m.Equipe2).includes(filters.equipe)) {
    return false;
  }
  if (filters.departement && !missionDepartementTokens(m).includes(filters.departement)) {
    return false;
  }
  if (filters.produitIds.length > 0) {
    const ref = extractGristReferenceId(m.Produit_SDPC);
    if (ref == null || !filters.produitIds.includes(String(ref))) {
      return false;
    }
  }
  if (filters.intervenantIds.length > 0) {
    const missionIntervenantIds = intervenantIdsForMaster(
      missionEnfants,
      m.id,
      m.Intervenants,
    );
    const selectedIds = filters.intervenantIds
      .map((s) => Number.parseInt(s, 10))
      .filter((n) => Number.isFinite(n));
    if (!selectedIds.some((id) => missionIntervenantIds.includes(id))) {
      return false;
    }
  }
  const staffing = filters.staffing ?? "";
  if (staffing === "avec-prestation") {
    const n =
      options.enfantsByMaster?.get(m.id)?.length ??
      missionEnfants.filter((e) => extractGristReferenceId(e.Mission) === m.id).length;
    if (n === 0) {
      return false;
    }
  }
  if (staffing === "sans-prestation") {
    const n =
      options.enfantsByMaster?.get(m.id)?.length ??
      missionEnfants.filter((e) => extractGristReferenceId(e.Mission) === m.id).length;
    if (n > 0) {
      return false;
    }
  }
  if (staffing === "cra-hors-prestation") {
    if (options.staffingCraPending) {
      return true;
    }
    const suivi = options.suiviRows;
    const sumFn = options.sumHorsPrestationTtc;
    if (suivi && sumFn) {
      if (sumFn(suivi, m.id, missionEnfants) <= 0) {
        return false;
      }
    }
  }
  const q = filters.search.trim().toLowerCase();
  if (q) {
    const words = q.split(/\s+/).filter(Boolean);
    const title = (m.Nom_de_la_mission ?? "").trim().toLowerCase();
    const produit = libelleProduitMission(m, produitsById).toLowerCase();
    if (!words.every((w) => `${title} ${produit}`.includes(w))) {
      return false;
    }
  }
  return true;
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" }),
  );
}

export function missionStatutOptions(missions: Mission[]): string[] {
  return uniqueSorted(
    missions.map((m) => m.Statut?.trim() ?? "").filter((s) => s.length > 0),
  );
}

export function missionEquipeOptions(missions: Mission[]): string[] {
  const set = new Set<string>();
  for (const m of missions) {
    for (const equipe of extractGristStringTokens(m.Equipe2)) {
      set.add(equipe);
    }
  }
  return uniqueSorted(set);
}

export function missionDepartementOptions(missions: Mission[]): string[] {
  const set = new Set<string>();
  for (const m of missions) {
    for (const token of missionDepartementTokens(m)) {
      set.add(token);
    }
  }
  return uniqueSorted(set);
}

export type MissionFilterOption = { id: number; label: string };

export function missionProduitOptions(
  missions: Mission[],
  produitsById: Map<number, string>,
): MissionFilterOption[] {
  const ids = new Set<number>();
  for (const m of missions) {
    const ref = extractGristReferenceId(m.Produit_SDPC);
    if (ref != null && ref !== 0) {
      ids.add(ref);
    }
  }
  return [...ids]
    .map((id) => ({
      id,
      label: produitsById.get(id) ?? libelleProduitGrist({}, id),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

export function missionIntervenantOptions(
  missions: Mission[],
  enfants: MissionEnfant[],
  intervenantsById: Map<number, string>,
): MissionFilterOption[] {
  const ids = new Set<number>();
  for (const m of missions) {
    for (const id of intervenantIdsForMaster(enfants, m.id, m.Intervenants)) {
      ids.add(id);
    }
  }
  return [...ids]
    .map((id) => ({
      id,
      label: intervenantsById.get(id) ?? `Intervenant #${id}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

export function enfantsByMasterId(
  enfants: MissionEnfant[],
): Map<number, MissionEnfant[]> {
  const map = new Map<number, MissionEnfant[]>();
  for (const e of enfants) {
    const mid = extractGristReferenceId(e.Mission);
    if (mid == null || mid === 0) {
      continue;
    }
    const list = map.get(mid) ?? [];
    list.push(e);
    map.set(mid, list);
  }
  return map;
}
