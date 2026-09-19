import type { EquipeMember } from "../types";

export const EQUIPE_DEFAULT_STATUT = "Actif";

export function equipeDisplayName(member: EquipeMember): string {
  const name = member.Prenom_Nom?.trim();
  return name || `Personne #${member.id}`;
}

export function uniqueSortedLabels(values: readonly (string | undefined)[]): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const label = value?.trim();
    if (label) {
      set.add(label);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

/** True si au moins une fiche a une valeur lisible (hors vide / CENSORED ACL). */
export function equipeFieldReadable(
  members: readonly EquipeMember[],
  key: keyof EquipeMember,
): boolean {
  return members.some((member) => {
    const raw = member[key];
    if (typeof raw !== "string") {
      return false;
    }
    const t = raw.trim();
    return t !== "" && t !== "CENSORED" && t !== "..." && !t.startsWith("[Pending");
  });
}

/** True si un montant Equipe est réellement lisible (Access Rules). */
export function equipeMontantLisible(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Filtre statut initial : « Actif » seulement si la colonne Statut est lisible
 * et contient cette valeur (sinon « tous » — cas Freelance / ACL colonnes).
 */
export function initialEquipeStatutFilter(members: readonly EquipeMember[]): string {
  const options = uniqueSortedLabels(members.map((m) => m.Statut));
  if (options.includes(EQUIPE_DEFAULT_STATUT)) {
    return EQUIPE_DEFAULT_STATUT;
  }
  return "";
}

export type EquipeListFilters = {
  search: string;
  statut: string;
  equipe: string;
  portage: string;
  role: string;
};

export function filterEquipeMembers(
  members: readonly EquipeMember[],
  filters: EquipeListFilters,
): EquipeMember[] {
  const q = filters.search.trim().toLowerCase();
  return members
    .filter((member) => {
      const okStatut = !filters.statut || (member.Statut?.trim() ?? "") === filters.statut;
      const okEquipe = !filters.equipe || (member.Equipe?.trim() ?? "") === filters.equipe;
      const okPortage = !filters.portage || (member.Portage?.trim() ?? "") === filters.portage;
      const okRole = !filters.role || (member.Role_ACL?.trim() ?? "") === filters.role;
      if (!okStatut || !okEquipe || !okPortage || !okRole) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = [
        equipeDisplayName(member),
        member.Equipe,
        member.Portage,
        member.Statut,
        member.Specialite,
        member.Role_ACL,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) =>
      equipeDisplayName(a).localeCompare(equipeDisplayName(b), "fr", { sensitivity: "base" }),
    );
}
