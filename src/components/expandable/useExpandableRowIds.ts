import { useCallback, useState } from "react";

export type ExpandableRowId = string | number;

function resetKeyToString(key: unknown): string {
  return typeof key === "string" || typeof key === "number" ? String(key) : JSON.stringify(key);
}

/**
 * État multi-ouvert pour lignes de tableau expansibles.
 * Passer `resetKey` (filtres, jeu de lignes) pour replier au changement de contexte.
 */
export function useExpandableRowIds<T extends ExpandableRowId = number>(
  initial?: Iterable<T>,
  resetKey?: unknown,
) {
  const [expandedIds, setExpandedIds] = useState<Set<T>>(() => new Set(initial));

  const resetKeySerialized = resetKey === undefined ? null : resetKeyToString(resetKey);
  const [storedResetKey, setStoredResetKey] = useState(resetKeySerialized);

  if (resetKeySerialized != null && resetKeySerialized !== storedResetKey) {
    setStoredResetKey(resetKeySerialized);
    if (expandedIds.size > 0) {
      setExpandedIds(new Set());
    }
  }

  const isExpanded = useCallback((id: T) => expandedIds.has(id), [expandedIds]);

  const toggle = useCallback((id: T) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return { expandedIds, isExpanded, toggle };
}
