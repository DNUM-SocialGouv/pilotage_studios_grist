/**
 * Helpers lecture colonnes Grist Attachments (`["L", id1, …]`, tableau d’ids, id seul).
 */

/** Ids de pièces jointes référencés par une cellule Attachments. */
export function extractGristAttachmentIds(value: unknown): number[] {
  const out = new Set<number>();
  const walk = (v: unknown): void => {
    if (v == null) {
      return;
    }
    if (typeof v === "number" && Number.isFinite(v)) {
      const n = Math.trunc(v);
      if (n !== 0) {
        out.add(n);
      }
      return;
    }
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed) {
        return;
      }
      const asInt = Number.parseInt(trimmed, 10);
      if (Number.isFinite(asInt) && asInt !== 0 && String(asInt) === trimmed) {
        out.add(asInt);
        return;
      }
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        for (const part of trimmed.slice(1, -1).split(",")) {
          walk(part.trim());
        }
      }
      return;
    }
    if (Array.isArray(v)) {
      if (v[0] === "L") {
        v.slice(1).forEach(walk);
        return;
      }
      v.forEach(walk);
    }
  };
  walk(value);
  return [...out];
}
