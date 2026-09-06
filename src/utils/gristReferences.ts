/** Liste multi-valeurs Grist : souvent `["L", ...valeurs]`. */
export function parseGristList(value: unknown): string[] {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value) && value[0] === "L") {
    return value.slice(1).map(String);
  }
  if (
    Array.isArray(value) &&
    value[0] === "l" &&
    value.length >= 2 &&
    typeof value[1] === "string"
  ) {
    return [value[1]];
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [String(value)];
}

/** Tokens texte d’une Choice / ChoiceList (équipe, etc.). */
export function extractGristStringTokens(value: unknown): string[] {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return parseGristList(value)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (t.length === 0) {
      return [];
    }
    if (t.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(t);
        if (Array.isArray(parsed)) {
          return parseGristList(parsed)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        }
      } catch {
        /* chaîne non JSON */
      }
    }
    return [t];
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return [String(value)];
  }
  return [];
}

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
