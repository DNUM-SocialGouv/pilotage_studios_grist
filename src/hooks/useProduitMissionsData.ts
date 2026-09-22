import { useEffect, useState } from "react";
import type { Mission } from "../types";
import { recordsFromFetchTable, toMission } from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";

export type ProduitMissionsStatus = "idle" | "loading" | "ok" | "error";

export type ProduitMissionsData = {
  status: ProduitMissionsStatus;
  error: string | null;
  missions: Mission[];
};

const EMPTY: ProduitMissionsData = {
  status: "idle",
  error: null,
  missions: [],
};

/**
 * Missions — lazy sur la fiche `/produits/:id` uniquement (filtre Produit_SDPC côté UI).
 */
export function useProduitMissionsData(enabled: boolean): ProduitMissionsData {
  const [state, setState] = useState<ProduitMissionsData>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, status: "loading" });

    void (async () => {
      try {
        const raw = await fetchAllowlistedTable("Missions");
        if (cancelled) {
          return;
        }
        setState({
          status: "ok",
          error: null,
          missions: recordsFromFetchTable(raw).map(toMission),
        });
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
              : "Les missions liées n’ont pas pu être chargées.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
