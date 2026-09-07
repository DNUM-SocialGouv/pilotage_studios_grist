import type { Mission, MissionEnfant, ProduitSdpc } from "../types.ts";
import { extractGristReferenceId, extractGristStringTokens } from "./gristReferences.ts";
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

export type MissionsListFilters = {
  search: string;
  equipe: string;
  statut: string;
};

export function missionMatchesFilters(
  m: Mission,
  filters: MissionsListFilters,
  produitsById: Map<number, string>,
): boolean {
  const okStatut = !filters.statut || m.Statut?.trim() === filters.statut;
  const equipes = extractGristStringTokens(m.Equipe2);
  const okEquipe = !filters.equipe || equipes.includes(filters.equipe);
  const q = filters.search.trim().toLowerCase();
  if (!q) {
    return okStatut && okEquipe;
  }
  const words = q.split(/\s+/).filter(Boolean);
  const title = (m.Nom_de_la_mission ?? "").trim().toLowerCase();
  const produit = libelleProduitMission(m, produitsById).toLowerCase();
  const hay = `${title} ${produit}`;
  const okSearch = words.every((w) => hay.includes(w));
  return okStatut && okEquipe && okSearch;
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
