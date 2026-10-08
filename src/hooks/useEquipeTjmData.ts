import { useCallback, useEffect, useState } from "react";
import { recordsFromFetchTable } from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import {
  filterEquipeTjmForPersonne,
  toEquipeTjmRow,
  type EquipeTjmRow,
} from "../utils/equipeTjm";

export type EquipeTjmDataStatus = "idle" | "loading" | "ok" | "error";

export async function loadEquipeTjmTable(): Promise<EquipeTjmRow[]> {
  const raw = await fetchAllowlistedTable("Equipe_TJM");
  return recordsFromFetchTable(raw)
    .map((r) => toEquipeTjmRow(r))
    .filter((r): r is EquipeTjmRow => r != null);
}

export async function loadEquipeTjmForPersonne(personneId: number): Promise<EquipeTjmRow[]> {
  const all = await loadEquipeTjmTable();
  return filterEquipeTjmForPersonne(all, personneId);
}

/**
 * Grille `Equipe_TJM` pour une fiche personne (lazy, lecture).
 */
export function useEquipeTjmForPersonne(personneId: number | null, enabled: boolean) {
  const [status, setStatus] = useState<EquipeTjmDataStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<EquipeTjmRow[]>([]);

  const reload = useCallback(async () => {
    if (!enabled || personneId == null || !Number.isFinite(personneId) || personneId <= 0) {
      setRows([]);
      setStatus("idle");
      setError(null);
      return;
    }
    setStatus("loading");
    try {
      const next = await loadEquipeTjmForPersonne(personneId);
      setRows(next);
      setError(null);
      setStatus("ok");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Les tarifs journaliers n’ont pas pu être chargés.",
      );
      setStatus("error");
      throw err;
    }
  }, [enabled, personneId]);

  useEffect(() => {
    if (!enabled || personneId == null || !Number.isFinite(personneId) || personneId <= 0) {
      setRows([]);
      setStatus("idle");
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    void (async () => {
      try {
        const next = await loadEquipeTjmForPersonne(personneId);
        if (cancelled) {
          return;
        }
        setRows(next);
        setError(null);
        setStatus("ok");
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Les tarifs journaliers n’ont pas pu être chargés.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, personneId]);

  return { status, error, rows, reload };
}
