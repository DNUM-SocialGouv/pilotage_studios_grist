/**
 * Ids de pièces jointes référencés par une cellule Attachments.
 * Accepte `["L", id…]`, `[id…]` (déjà décodé), `"[44]"` (SQL/texte), id seul.
 */
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
      if (!trimmed || trimmed === "CENSORED") {
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
      return;
    }
    // Objet `{ id: n }` parfois renvoyé par certaines APIs
    if (typeof v === "object" && v !== null && "id" in v) {
      walk((v as { id: unknown }).id);
    }
  };
  walk(value);
  return [...out];
}
