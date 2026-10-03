/**
 * Index de pile MemoryHistory (routeur en mémoire du widget).
 * `0` = première entrée — pas de « page précédente » interne.
 */
export function canGoBackFromHistoryIndex(index: number | null | undefined): boolean {
  return typeof index === "number" && index > 0;
}

/** Lit `index` si le navigator est un MemoryHistory ; sinon `null`. */
export function readMemoryHistoryIndex(navigator: object): number | null {
  if (!("index" in navigator)) {
    return null;
  }
  const index = (navigator as { index: unknown }).index;
  return typeof index === "number" ? index : null;
}
