import { useCallback, useEffect, useState } from "react";

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

  useEffect(() => {
    if (resetKeySerialized == null) {
      return;
    }
    setExpandedIds(new Set());
  }, [resetKeySerialized]);

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
