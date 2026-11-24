/**
 * Couleurs d’accentuation DSFR stables pour les financeurs (`BDC.Financeur`).
 * Réutiliser via `financeurBadgeClass` / `FinanceurBadges` partout dans le widget.
 */

/** Accents DSFR utilisables avec `fr-badge--{accent}`. */
export type FinanceurBadgeAccent =
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

const FALLBACK_ACCENTS: readonly FinanceurBadgeAccent[] = [
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

/**
 * Mapping figé des financeurs connus (insensible à la casse).
 * Les directions (DAC / DNUM / DGEFP) restent lisibles en famille de teintes.
 */
const FINANCEUR_ACCENT_BY_KEY: Record<string, FinanceurBadgeAccent> = {
  "dac - dgcs": "green-menthe",
  "dac - dgt": "green-archipel",
  "dac - dicom": "beige-gris-galet",
  "dac - dns": "brown-caramel",
  "dgefp - misi": "yellow-moutarde",
  "dnum - ars": "blue-ecume",
  "dnum - contractuel": "green-menthe",
  "dnum - dd": "purple-glycine",
  "dnum - gps": "pink-tuile",
  "dnum - simars": "orange-terre-battue",
  "dnum - spc": "blue-cumulus",
  "dnum - spot": "green-archipel",
};

function normalizeFinanceurKey(label: string): string {
  return label.replace(/\u00a0/g, " ").trim().toLowerCase();
}

function hashToIndex(label: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < label.length; i += 1) {
    h = (h * 31 + label.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : h % modulo;
}

/** Accent DSFR pour un libellé de financeur (stable pour un même libellé). */
export function financeurBadgeAccent(label: string): FinanceurBadgeAccent {
  const key = normalizeFinanceurKey(label);
  const known = FINANCEUR_ACCENT_BY_KEY[key];
  if (known) {
    return known;
  }
  return FALLBACK_ACCENTS[hashToIndex(key, FALLBACK_ACCENTS.length)]!;
}

/** Classe `fr-badge--…` pour un libellé de financeur. */
export function financeurBadgeClass(label: string): string {
  return `fr-badge--${financeurBadgeAccent(label)}`;
}
