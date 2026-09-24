import { useCallback, useEffect, useState } from "react";
import { recordsFromFetchTable, toEquipeMember } from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import type { EquipeMember } from "../types";

export type EquipeDataStatus = "idle" | "loading" | "ok" | "error";

export type EquipeData = {
  status: EquipeDataStatus;
  error: string | null;
  members: EquipeMember[];
};

export type EquipeDataState = EquipeData & {
  isReloading: boolean;
  reloadEquipe: () => Promise<void>;
};

const EMPTY: EquipeData = {
  status: "idle",
  error: null,
  members: [],
};

export async function loadEquipeTable(): Promise<EquipeMember[]> {
  const raw = await fetchAllowlistedTable("Equipe");
  return recordsFromFetchTable(raw).map(toEquipeMember);
}

/**
 * Table `Equipe` — chargé sur `/equipe` uniquement (lazy, lecture + reload après create).
 */
export function useEquipeData(enabled: boolean): EquipeDataState {
  const [state, setState] = useState<EquipeData>(EMPTY);
  const [isReloading, setIsReloading] = useState(false);

  const reloadEquipe = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setIsReloading(true);
    try {
      const members = await loadEquipeTable();
      setState({ status: "ok", error: null, members });
    } catch (err) {
      setState((prev) => {
        if (prev.status === "ok") {
          return prev;
        }
        return {
          ...prev,
          status: "error",
          error:
            err instanceof Error
              ? err.message
              : "La liste de l’équipe n’a pas pu être chargée.",
        };
      });
      throw err;
    } finally {
      setIsReloading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, status: "loading" });

    void (async () => {
      try {
        const members = await loadEquipeTable();
        if (cancelled) {
          return;
        }
        setState({ status: "ok", error: null, members });
      } catch (err) {
        if (cancelled) {
          return;
        }
        setState({
          ...EMPTY,
          status: "error",
          error:
            err instanceof Error
              ? err.message
              : "La liste de l’équipe n’a pas pu être chargée.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { ...state, isReloading, reloadEquipe };
}
