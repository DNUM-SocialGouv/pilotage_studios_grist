import { useEffect, useState } from "react";
import type { Mission, MissionEnfant } from "../types";
import type { GristFetchTableResult } from "../gristTypes";
import { recordsFromFetchTable, toMission, toMissionEnfant } from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";

export type EquipeMemberMissionsStatus = "idle" | "loading" | "ok" | "error";

export type EquipeMemberMissionsData = {
  status: EquipeMemberMissionsStatus;
  error: string | null;
  missions: Mission[];
  missionEnfants: MissionEnfant[];
};

const EMPTY: EquipeMemberMissionsData = {
  status: "idle",
  error: null,
  missions: [],
  missionEnfants: [],
};

async function loadMissionsAndEnfants(): Promise<{
  missions: Mission[];
  missionEnfants: MissionEnfant[];
}> {
  const settled = await Promise.allSettled([
    fetchAllowlistedTable("Missions"),
    fetchAllowlistedTable("Missions_enfants"),
  ]);

  const pick = <T>(
    index: number,
    map: (raw: GristFetchTableResult) => T[],
    required: boolean,
  ): T[] => {
    const result = settled[index];
    if (result?.status === "fulfilled") {
      return map(result.value);
    }
    if (required) {
      const reason = result?.status === "rejected" ? result.reason : undefined;
      throw reason instanceof Error
        ? reason
        : new Error("Lecture Missions / Missions_enfants impossible.");
    }
    return [];
  };

  // Missions obligatoire ; enfants sans missions = section vide plutôt qu’erreur dure.
  const missions = pick(0, (raw) => recordsFromFetchTable(raw).map(toMission), true);
  const missionEnfants = pick(
    1,
    (raw) => recordsFromFetchTable(raw).map(toMissionEnfant),
    false,
  );

  if (settled[1]?.status === "rejected" && missions.length > 0) {
    // Prestations indisponibles : on remonte une erreur explicite.
    const reason = settled[1].reason;
    throw reason instanceof Error
      ? reason
      : new Error("Lecture Missions_enfants impossible.");
  }

  return { missions, missionEnfants };
}

/**
 * Missions + prestations — lazy sur la fiche `/equipe/:id` uniquement.
 * Pas de Realise (proposition B).
 */
export function useEquipeMemberMissionsData(enabled: boolean): EquipeMemberMissionsData {
  const [state, setState] = useState<EquipeMemberMissionsData>(EMPTY);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, status: "loading" });

    void (async () => {
      try {
        const loaded = await loadMissionsAndEnfants();
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
              : "Les missions de la personne n’ont pas pu être chargées.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
