import { useEffect, useState } from "react";
import { recordsFromFetchTable, toProduitSdpc } from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import type { ProduitSdpc } from "../types";

export type ProduitsDataStatus = "idle" | "loading" | "ok" | "error";

export type ProduitsData = {
  status: ProduitsDataStatus;
  error: string | null;
  produits: ProduitSdpc[];
};

const EMPTY: ProduitsData = {
  status: "idle",
  error: null,
  produits: [],
};

export async function loadProduitsTable(): Promise<ProduitSdpc[]> {
  const raw = await fetchAllowlistedTable("Tableau_de_pilotage_SDPC_Produits_SDPC");
  return recordsFromFetchTable(raw).map(toProduitSdpc);
}

/**
 * Catalogue produits SDPC — chargé sur `/produits` uniquement (lazy, lecture).
 */
export function useProduitsData(enabled: boolean): ProduitsData {
  const [state, setState] = useState<ProduitsData>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, status: "loading" });

    void (async () => {
      try {
        const produits = await loadProduitsTable();
        if (cancelled) {
          return;
        }
        setState({ status: "ok", error: null, produits });
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
              : "Le catalogue produits n’a pas pu être chargé.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
