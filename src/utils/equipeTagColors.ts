/**
 * Modificateurs de couleur des tags DSFR (suffixe après `fr-tag--`).
 * Copie widget de l’app sœur — liste missions seulement.
 */
export const EQUIPE_TAG_DSFR_MODIFIERS = [
  "blue-cumulus",
  "green-menthe",
  "purple-glycine",
  "pink-macaron",
  "yellow-tournesol",
  "orange-terre-battue",
  "green-archipel",
  "blue-ecume",
  "green-emeraude",
  "green-bourgeon",
  "green-tilleul-verveine",
  "pink-tuile",
  "yellow-moutarde",
  "brown-caramel",
  "brown-opera",
  "beige-gris-galet",
] as const;

export type EquipeTagDsfrModifier = (typeof EQUIPE_TAG_DSFR_MODIFIERS)[number];

/**
 * Teinte stable par libellé (même équipe → même couleur sur toutes les lignes).
 * Mélange FNV-1a + DJB2 + finalisation pour limiter les collisions modulo
 * (ex. « Design » et « Access. » avec l’ancien seul FNV).
 */
export function equipeTagDsfrModifierForLabel(label: string): EquipeTagDsfrModifier {
  const key = label.trim().toLowerCase();
  if (!key) {
    return EQUIPE_TAG_DSFR_MODIFIERS[0];
  }
  let fnv = 2166136261 >>> 0;
  let djb = 5381;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    fnv ^= c;
    fnv = Math.imul(fnv, 16777619) >>> 0;
    djb = (djb * 33 + c) >>> 0;
  }
  let h = (fnv ^ djb ^ Math.imul(key.length, 0x9e3779b9)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  const idx = (h >>> 0) % EQUIPE_TAG_DSFR_MODIFIERS.length;
  return EQUIPE_TAG_DSFR_MODIFIERS[idx]!;
}

/** Token CSS `background-action-low` (fond tag / barre timeline). */
export function equipeTagBackgroundVar(label: string): string {
  return `var(--background-action-low-${equipeTagDsfrModifierForLabel(label)})`;
}

/** Token CSS `text-action-high` (texte tag). */
export function equipeTagTextVar(label: string): string {
  return `var(--text-action-high-${equipeTagDsfrModifierForLabel(label)})`;
}
