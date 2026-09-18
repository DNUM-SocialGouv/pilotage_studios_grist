import { useEffect, useState } from "react";
import { recordsFromFetchTable, toEquipeMember } from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import type { EquipeMember } from "../types";

export type EquipeDataStatus = "idle" | "loading" | "ok" | "error";

export type EquipeData = {
  status: EquipeDataStatus;
  error: string | null;
  members: EquipeMember[];
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
 * Table `Equipe` — chargé sur `/equipe` uniquement (lazy, lecture).
 */
export function useEquipeData(enabled: boolean): EquipeData {
  const [state, setState] = useState<EquipeData>(EMPTY);

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

  return state;
}
