/**
 * Données Weekly : missions + satellites phase / agenda (lazy `/weekly`).
 */

import { useCallback, useEffect, useState } from "react";
import type { GristFetchTableResult, GristRecord } from "../gristTypes";
import {
  recordsFromFetchTable,
  toIntervenant,
  toMission,
  toMissionEnfant,
  toProduitSdpc,
  toWeeklyAgenda,
  toWeeklyPhase,
} from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import type {
  Intervenant,
  Mission,
  MissionEnfant,
  ProduitSdpc,
  WeeklyAgendaRow,
  WeeklyPhaseRow,
} from "../types";

export type WeeklyCoachDataStatus = "idle" | "loading" | "ok" | "error";

export type WeeklyCoachData = {
  status: WeeklyCoachDataStatus;
  error: string | null;
  refsError: string | null;
  missions: Mission[];
  missionEnfants: MissionEnfant[];
  intervenants: Intervenant[];
  produits: ProduitSdpc[];
  phases: WeeklyPhaseRow[];
  agenda: WeeklyAgendaRow[];
};

export type WeeklyCoachDataState = WeeklyCoachData & {
  isReloading: boolean;
  reload: () => Promise<void>;
};

const EMPTY: WeeklyCoachData = {
  status: "idle",
  error: null,
  refsError: null,
  missions: [],
  missionEnfants: [],
  intervenants: [],
  produits: [],
  phases: [],
  agenda: [],
};

export async function loadWeeklyCoachTables(): Promise<
  Omit<WeeklyCoachData, "status" | "error">
> {
  const labels = [
    "Missions",
    "Missions_enfants",
    "Equipe",
    "produits",
    "Weekly_phase",
    "Weekly_agenda",
  ] as const;
  const settled = await Promise.allSettled([
    fetchAllowlistedTable("Missions"),
    fetchAllowlistedTable("Missions_enfants"),
    fetchAllowlistedTable("Equipe"),
    fetchAllowlistedTable("Tableau_de_pilotage_SDPC_Produits_SDPC"),
    fetchAllowlistedTable("Weekly_phase"),
    fetchAllowlistedTable("Weekly_agenda"),
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

  if (settled[0]?.status === "rejected") {
    const reason = settled[0].reason;
    throw reason instanceof Error ? reason : new Error("Lecture Missions impossible.");
  }

  return {
    refsError:
      failed.filter((name) => name !== "Missions").length > 0
        ? `Référentiels partiels indisponibles : ${failed.filter((name) => name !== "Missions").join(", ")}. L’affichage peut être incomplet.`
        : null,
    missions: pick(0, (raw) => recordsFromFetchTable(raw).map(toMission)),
    missionEnfants: pick(1, (raw) => recordsFromFetchTable(raw).map(toMissionEnfant)),
    intervenants: pick(2, (raw) => recordsFromFetchTable(raw).map(toIntervenant)),
    produits: pick(3, (raw) => recordsFromFetchTable(raw).map(toProduitSdpc)),
    phases: pick(4, (raw) =>
      recordsFromFetchTable(raw).map((row) => toWeeklyPhase(row as GristRecord)),
    ),
    agenda: pick(5, (raw) =>
      recordsFromFetchTable(raw).map((row) => toWeeklyAgenda(row as GristRecord)),
    ),
  };
}

export function useWeeklyCoachData(enabled: boolean): WeeklyCoachDataState {
  const [state, setState] = useState<WeeklyCoachData>(EMPTY);
  const [isReloading, setIsReloading] = useState(false);

  const load = useCallback(async (isReload: boolean) => {
    if (isReload) {
      setIsReloading(true);
    } else {
      setState((s) => ({ ...s, status: "loading", error: null }));
    }
    try {
      const data = await loadWeeklyCoachTables();
      setState({
        status: "ok",
        error: null,
        ...data,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Chargement Weekly impossible.";
      setState((s) => ({
        ...s,
        status: "error",
        error: message,
      }));
    } finally {
      setIsReloading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }
    void load(false);
  }, [enabled, load]);

  const reload = useCallback(async () => {
    await load(true);
  }, [load]);

  return { ...state, isReloading, reload };
}
