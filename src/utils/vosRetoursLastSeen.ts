/**
 * « Lu » local pour le bloc « Vos retours » (pas d’écriture Grist).
 * Clé : ticketId → horodatage + colonne vue.
 */

export const VOS_RETOURS_LAST_SEEN_STORAGE_KEY = "pilotage.vosRetours.lastSeen.v1";

export type VosRetoursLastSeenEntry = {
  /** Epoch ms de la dernière ouverture du drawer. */
  seenAt: number;
  /** Colonne au moment de la lecture. */
  column: string;
};

export type VosRetoursLastSeenMap = Record<string, VosRetoursLastSeenEntry>;

function isEntry(value: unknown): value is VosRetoursLastSeenEntry {
  if (value == null || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.seenAt === "number" &&
    Number.isFinite(row.seenAt) &&
    typeof row.column === "string"
  );
}

/** Lecture défensive (JSON corrompu → map vide). */
export function readVosRetoursLastSeen(
  raw: string | null | undefined,
): VosRetoursLastSeenMap {
  if (raw == null || raw.trim() === "") return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: VosRetoursLastSeenMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isEntry(value)) {
        out[key] = { seenAt: value.seenAt, column: value.column };
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function loadVosRetoursLastSeen(
  storage: Pick<Storage, "getItem"> | null | undefined = typeof localStorage !== "undefined"
    ? localStorage
    : null,
): VosRetoursLastSeenMap {
  if (!storage) return {};
  try {
    return readVosRetoursLastSeen(storage.getItem(VOS_RETOURS_LAST_SEEN_STORAGE_KEY));
  } catch {
    return {};
  }
}

export function markVosRetourSeen(
  ticketId: number,
  column: string,
  nowMs: number = Date.now(),
  storage: Pick<Storage, "getItem" | "setItem"> | null | undefined = typeof localStorage !==
  "undefined"
    ? localStorage
    : null,
): VosRetoursLastSeenMap {
  const prev = loadVosRetoursLastSeen(storage);
  const next: VosRetoursLastSeenMap = {
    ...prev,
    [String(ticketId)]: { seenAt: nowMs, column },
  };
  if (storage) {
    try {
      storage.setItem(VOS_RETOURS_LAST_SEEN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota / mode privé — silence */
    }
  }
  return next;
}
