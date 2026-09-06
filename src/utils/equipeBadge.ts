/**
 * Couleurs d’accentuation DSFR stables pour les libellés d’équipe (`BDC.Equipe2`).
 * Réutiliser via `equipeBadgeClass` / `EquipeBadges` partout dans le widget.
 */

/** Accents DSFR utilisables avec `fr-badge--{accent}`. */
export type EquipeBadgeAccent =
  | "purple-glycine"
  | "blue-ecume"
  | "green-menthe"
  | "orange-terre-battue"
  | "yellow-moutarde"
  | "pink-tuile"
  | "green-archipel"
  | "brown-caramel"
  | "blue-cumulus"
  | "beige-gris-galet";

const FALLBACK_ACCENTS: readonly EquipeBadgeAccent[] = [
  "purple-glycine",
  "blue-ecume",
  "green-menthe",
  "orange-terre-battue",
  "yellow-moutarde",
  "pink-tuile",
  "green-archipel",
  "brown-caramel",
  "blue-cumulus",
  "beige-gris-galet",
] as const;

/** Mapping figé des équipes métier connues (insensible à la casse). */
const EQUIPE_ACCENT_BY_KEY: Record<string, EquipeBadgeAccent> = {
  design: "purple-glycine",
  ru: "blue-ecume",
  product: "green-menthe",
  "access.": "orange-terre-battue",
  access: "orange-terre-battue",
  coach: "yellow-moutarde",
};

function normalizeEquipeKey(label: string): string {
  return label.replace(/\u00a0/g, " ").trim().toLowerCase();
}

function hashToIndex(label: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < label.length; i += 1) {
    h = (h * 31 + label.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : h % modulo;
}

/** Accent DSFR pour un libellé d’équipe (stable pour un même libellé). */
export function equipeBadgeAccent(label: string): EquipeBadgeAccent {
  const key = normalizeEquipeKey(label);
  const known = EQUIPE_ACCENT_BY_KEY[key];
  if (known) {
    return known;
  }
  return FALLBACK_ACCENTS[hashToIndex(key, FALLBACK_ACCENTS.length)]!;
}

/** Classe `fr-badge--…` pour un libellé d’équipe. */
export function equipeBadgeClass(label: string): string {
  return `fr-badge--${equipeBadgeAccent(label)}`;
}
