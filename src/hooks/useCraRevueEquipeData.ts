/**
 * Données pour `/cra/revue-equipe` : manager + membres du département + Realise.
 */

import { useCallback, useEffect, useState } from "react";
import { useAclProfil } from "../AclProfilContext";
import { loadMissionsTables, type MissionsData } from "./useMissionsData";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import { recordsFromFetchTable, toEquipeMember } from "../gristMap";
import type { EquipeMember } from "../types";
import {
  resolveSelfEquipeIdentity,
  type SelfEquipeIdentity,
} from "../utils/resolveSelfEquipeId";

export type CraRevueEquipeDataStatus = "idle" | "loading" | "ok" | "error";

export type CraRevueEquipeData = {
  status: CraRevueEquipeDataStatus;
  error: string | null;
  refsError: string | null;
  manager: SelfEquipeIdentity | null;
  members: EquipeMember[];
  missions: MissionsData["missions"];
  missionEnfants: MissionsData["missionEnfants"];
  suivi: MissionsData["suivi"];
};

export type CraRevueEquipeDataState = CraRevueEquipeData & {
  isReloading: boolean;
  reload: () => Promise<void>;
};

const EMPTY: CraRevueEquipeData = {
  status: "idle",
  error: null,
  refsError: null,
  manager: null,
  members: [],
  missions: [],
  missionEnfants: [],
  suivi: [],
};

async function loadCraRevueEquipeBundle(
  sessionEmail: string | null,
): Promise<Omit<CraRevueEquipeData, "status" | "error">> {
  const manager = await resolveSelfEquipeIdentity(
    () => fetchAllowlistedTable("Equipe"),
    sessionEmail,
  );
  const equipeRaw = await fetchAllowlistedTable("Equipe");
  const members = recordsFromFetchTable(equipeRaw).map(toEquipeMember);
  const tables = await loadMissionsTables();
  return {
    refsError: tables.refsError,
    manager,
    members,
    missions: tables.missions,
    missionEnfants: tables.missionEnfants,
    suivi: tables.suivi,
  };
}

export function useCraRevueEquipeData(enabled: boolean): CraRevueEquipeDataState {
  const { status: aclStatus, email: aclEmail } = useAclProfil();
  const [state, setState] = useState<CraRevueEquipeData>(EMPTY);
  const [isReloading, setIsReloading] = useState(false);

  const sessionReady = aclStatus === "ok" || aclStatus === "standalone";

  const reload = useCallback(async () => {
    setIsReloading(true);
    try {
      const data = await loadCraRevueEquipeBundle(aclEmail);
      setState({ status: "ok", error: null, ...data });
    } catch (err) {
      setState({
        ...EMPTY,
        status: "error",
        error:
          err instanceof Error
            ? err.message
            : "Impossible de charger les CRA de l’équipe.",
      });
    } finally {
      setIsReloading(false);
    }
  }, [aclEmail]);

  useEffect(() => {
    if (!enabled || !sessionReady) {
      if (!enabled) {
        setState(EMPTY);
      }
      return;
    }

    let cancelled = false;
    setState({ ...EMPTY, status: "loading" });

    void (async () => {
      try {
        const data = await loadCraRevueEquipeBundle(aclEmail);
        if (cancelled) {
          return;
        }
        setState({ status: "ok", error: null, ...data });
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
              : "Impossible de charger les CRA de l’équipe.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, sessionReady, aclEmail]);

  return { ...state, isReloading, reload };
}
