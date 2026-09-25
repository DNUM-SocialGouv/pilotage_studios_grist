import { useEffect, useState } from "react";
import type { GristFetchTableResult, GristRecord } from "../gristTypes";
import {
  recordsFromFetchTable,
  toMission,
  toMissionEnfant,
  toProduitSdpc,
  toSuiviMensuel,
} from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import type { Mission, MissionEnfant, ProduitSdpc, SuiviMensuel } from "../types";

export type ProduitsDataStatus = "idle" | "loading" | "ok" | "error";

export type ProduitsData = {
  status: ProduitsDataStatus;
  error: string | null;
  /** Référentiels CRA partiels absents (filtre investissement peut être incomplet). */
  refsError: string | null;
  produits: ProduitSdpc[];
  missions: Mission[];
  missionEnfants: MissionEnfant[];
  suivi: SuiviMensuel[];
};

const EMPTY: ProduitsData = {
  status: "idle",
  error: null,
  refsError: null,
  produits: [],
  missions: [],
  missionEnfants: [],
  suivi: [],
};

/**
 * Catalogue + tables nécessaires au filtre « investissement studio »
 * (Missions, prestations, Realise) — sans Equipe ni double fetch produits.
 */
export async function loadProduitsListTables(): Promise<
  Omit<ProduitsData, "status" | "error">
> {
  const labels = ["produits", "Missions", "Missions_enfants", "Realise"] as const;
  const settled = await Promise.allSettled([
    fetchAllowlistedTable("Tableau_de_pilotage_SDPC_Produits_SDPC"),
    fetchAllowlistedTable("Missions"),
    fetchAllowlistedTable("Missions_enfants"),
    fetchAllowlistedTable("Realise"),
  ]);

  const failed: string[] = [];
  const pick = <T>(
    index: number,
    map: (raw: GristFetchTableResult) => T[],
  ): T[] => {
    const result = settled[index];
    if (result?.status === "fulfilled") {
      return map(result.value);
    }
    failed.push(labels[index]!);
    return [];
  };

  const produits = pick(0, (raw) => recordsFromFetchTable(raw).map(toProduitSdpc));
  if (settled[0]?.status === "rejected") {
    const reason = settled[0].reason;
    throw reason instanceof Error
      ? reason
      : new Error("Lecture catalogue produits impossible.");
  }

  return {
    refsError:
      failed.filter((name) => name !== "produits").length > 0
        ? `Référentiels partiels indisponibles : ${failed.filter((name) => name !== "produits").join(", ")}. Le filtre investissement peut être incomplet.`
        : null,
    produits,
    missions: pick(1, (raw) => recordsFromFetchTable(raw).map(toMission)),
    missionEnfants: pick(2, (raw) => recordsFromFetchTable(raw).map(toMissionEnfant)),
    suivi: pick(3, (raw) =>
      recordsFromFetchTable(raw).map((row) => toSuiviMensuel(row as GristRecord)),
    ),
  };
}

/** @deprecated Préférer `loadProduitsListTables` (inclut CRA pour le filtre liste). */
export async function loadProduitsTable(): Promise<ProduitSdpc[]> {
  const loaded = await loadProduitsListTables();
  return loaded.produits;
}

/**
 * Catalogue produits SDPC + données investissement — chargé sur `/produits`
 * uniquement (lazy, lecture).
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
        const loaded = await loadProduitsListTables();
        if (cancelled) {
          return;
        }
        setState({ status: "ok", error: null, ...loaded });
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
