import { useEffect, useState } from "react";
import type { Intervenant, Mission, MissionEnfant, ProduitSdpc, SuiviMensuel } from "../types";
import type { GristFetchTableResult, GristRecord } from "../gristTypes";
import {
  recordsFromFetchTable,
  toIntervenant,
  toMission,
  toMissionEnfant,
  toProduitSdpc,
  toSuiviMensuel,
} from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";

export type MissionsDataStatus = "idle" | "loading" | "ok" | "error";

export type MissionsData = {
  status: MissionsDataStatus;
  error: string | null;
  refsError: string | null;
  missions: Mission[];
  missionEnfants: MissionEnfant[];
  intervenants: Intervenant[];
  produits: ProduitSdpc[];
  suivi: SuiviMensuel[];
};

const EMPTY: MissionsData = {
  status: "idle",
  error: null,
  refsError: null,
  missions: [],
  missionEnfants: [],
  intervenants: [],
  produits: [],
  suivi: [],
};

async function loadMissionsTables(): Promise<Omit<MissionsData, "status" | "error">> {
  const labels = [
    "Missions",
    "Missions_enfants",
    "Equipe",
    "produits",
    "Realise",
  ] as const;
  const settled = await Promise.allSettled([
    fetchAllowlistedTable("Missions"),
    fetchAllowlistedTable("Missions_enfants"),
    fetchAllowlistedTable("Equipe"),
    fetchAllowlistedTable("Tableau_de_pilotage_SDPC_Produits_SDPC"),
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

  const missions = pick(0, (raw) => recordsFromFetchTable(raw).map(toMission));
  if (settled[0]?.status === "rejected") {
    const reason = settled[0].reason;
    throw reason instanceof Error ? reason : new Error("Lecture Missions impossible.");
  }

  return {
    refsError:
      failed.filter((name) => name !== "Missions").length > 0
        ? `Référentiels partiels indisponibles : ${failed.filter((name) => name !== "Missions").join(", ")}. L’affichage peut être incomplet.`
        : null,
    missions,
    missionEnfants: pick(1, (raw) => recordsFromFetchTable(raw).map(toMissionEnfant)),
    intervenants: pick(2, (raw) => recordsFromFetchTable(raw).map(toIntervenant)),
    produits: pick(3, (raw) => recordsFromFetchTable(raw).map(toProduitSdpc)),
    suivi: pick(4, (raw) =>
      recordsFromFetchTable(raw).map((row) => toSuiviMensuel(row as GristRecord)),
    ),
  };
}

/**
 * Missions + enfants + CRA + référentiels — chargé uniquement sur `/missions`.
 * Pas au boot widget.
 */
export function useMissionsData(enabled: boolean): MissionsData {
  const [state, setState] = useState<MissionsData>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, status: "loading" });

    void (async () => {
      try {
        const loaded = await loadMissionsTables();
        if (cancelled) {
          return;
        }
        setState({
          status: "ok",
          error: null,
          ...loaded,
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
              : "La liste des missions n’a pas pu être chargée.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
