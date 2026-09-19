import { useEffect, useState } from "react";
import type { Mission, MissionEnfant } from "../types";
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

  const missionsResult = settled[0];
  if (missionsResult?.status !== "fulfilled") {
    const reason =
      missionsResult?.status === "rejected" ? missionsResult.reason : undefined;
    throw reason instanceof Error
      ? reason
      : new Error("Lecture Missions impossible.");
  }

  const enfantsResult = settled[1];
  if (enfantsResult?.status !== "fulfilled") {
    const reason =
      enfantsResult?.status === "rejected" ? enfantsResult.reason : undefined;
    throw reason instanceof Error
      ? reason
      : new Error("Lecture Missions_enfants impossible.");
  }

  return {
    missions: recordsFromFetchTable(missionsResult.value).map(toMission),
    missionEnfants: recordsFromFetchTable(enfantsResult.value).map(toMissionEnfant),
  };
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
