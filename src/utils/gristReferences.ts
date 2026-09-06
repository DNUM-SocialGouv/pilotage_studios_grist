/**
 * Extrait l’id de ligne cible d’une valeur « référence » Grist (nombre, chaîne, tuple, etc.).
 */
export function extractGristReferenceId(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const n = Number.parseInt(value.trim(), 10);
    return Number.isFinite(n) ? n : undefined;
  }
  if (Array.isArray(value)) {
    if (value[0] === "R" && value.length >= 3 && typeof value[2] === "number") {
      return Math.trunc(value[2]);
    }
    if (value[0] === "L" && value.length >= 2) {
      const tail = value.slice(1);
      if (tail.length === 1) {
        return extractGristReferenceId(tail[0]);
      }
      for (const item of tail) {
        const n = extractGristReferenceId(item);
        if (n !== undefined) {
          return n;
        }
      }
    }
    return extractGristReferenceId(value[0]);
  }
  if (typeof value === "object" && value !== null && "id" in value) {
    return extractGristReferenceId((value as { id: unknown }).id);
  }
  return undefined;
}
