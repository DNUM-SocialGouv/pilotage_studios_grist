/**
 * Données pour `/cra/declarer` : identité Equipe + missions / prestations / Realise.
 */

import { useCallback, useEffect, useState } from "react";
import { useAclProfil } from "../AclProfilContext";
import { loadMissionsTables, type MissionsData } from "./useMissionsData";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import {
  resolveSelfEquipeIdentity,
  type SelfEquipeIdentity,
} from "../utils/resolveSelfEquipeId";

export type CraDeclarerDataStatus = "idle" | "loading" | "ok" | "error";

export type CraDeclarerData = {
  status: CraDeclarerDataStatus;
  error: string | null;
  refsError: string | null;
  self: SelfEquipeIdentity | null;
  missions: MissionsData["missions"];
  missionEnfants: MissionsData["missionEnfants"];
  suivi: MissionsData["suivi"];
};

export type CraDeclarerDataState = CraDeclarerData & {
  isReloading: boolean;
  reload: () => Promise<void>;
};

const EMPTY: CraDeclarerData = {
  status: "idle",
  error: null,
  refsError: null,
  self: null,
  missions: [],
  missionEnfants: [],
  suivi: [],
};

async function loadCraDeclarerBundle(
  sessionEmail: string | null,
): Promise<Omit<CraDeclarerData, "status" | "error">> {
  const self = await resolveSelfEquipeIdentity(
    () => fetchAllowlistedTable("Equipe"),
    sessionEmail,
  );
  const tables = await loadMissionsTables();
  return {
    refsError: tables.refsError,
    self,
    missions: tables.missions,
    missionEnfants: tables.missionEnfants,
    suivi: tables.suivi,
  };
}

export function useCraDeclarerData(enabled: boolean): CraDeclarerDataState {
  const { status: aclStatus, email: aclEmail } = useAclProfil();
  const [state, setState] = useState<CraDeclarerData>(EMPTY);
  const [isReloading, setIsReloading] = useState(false);

  const sessionReady = aclStatus === "ok" || aclStatus === "standalone";

  const reload = useCallback(async () => {
    setIsReloading(true);
    try {
      const data = await loadCraDeclarerBundle(aclEmail);
      setState({ status: "ok", error: null, ...data });
    } catch (err) {
      setState({
        ...EMPTY,
        status: "error",
        error:
          err instanceof Error
            ? err.message
            : "Impossible de charger vos prestations pour la déclaration.",
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
        const data = await loadCraDeclarerBundle(aclEmail);
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
              : "Impossible de charger vos prestations pour la déclaration.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, sessionReady, aclEmail]);

  return { ...state, isReloading, reload };
}
