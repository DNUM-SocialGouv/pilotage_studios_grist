/**
 * Données pour `/cra/revue-equipe` : manager + membres du département + Realise.
 */

import { useCallback, useEffect, useState } from "react";
import { useAclProfil } from "../AclProfilContext";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import {
  recordsFromFetchTable,
  toEquipeMember,
  toMission,
  toMissionEnfant,
  toSuiviMensuel,
} from "../gristMap";
import type { GristFetchTableResult } from "../gristTypes";
import type { EquipeMember, Mission, MissionEnfant, SuiviMensuel } from "../types";
import {
  findSelfEquipeFromTable,
  resolveGristUserEmailForSelf,
  type SelfEquipeIdentity,
} from "../utils/resolveSelfEquipeId";

export type CraRevueEquipeDataStatus = "idle" | "loading" | "ok" | "error";

export type CraRevueEquipeData = {
  status: CraRevueEquipeDataStatus;
  error: string | null;
  refsError: string | null;
  manager: SelfEquipeIdentity | null;
  members: EquipeMember[];
  missions: Mission[];
  missionEnfants: MissionEnfant[];
  suivi: SuiviMensuel[];
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
  const email = await resolveGristUserEmailForSelf(sessionEmail);

  const settled = await Promise.allSettled([
    fetchAllowlistedTable("Equipe"),
    fetchAllowlistedTable("Missions"),
    fetchAllowlistedTable("Missions_enfants"),
    fetchAllowlistedTable("Realise"),
  ]);

  const equipeResult = settled[0];
  if (equipeResult?.status !== "fulfilled") {
    const reason = equipeResult?.status === "rejected" ? equipeResult.reason : null;
    throw reason instanceof Error
      ? reason
      : new Error("Lecture Équipe impossible.");
  }

  const manager = findSelfEquipeFromTable(equipeResult.value, email);
  if (!manager) {
    throw new Error(
      "Impossible de retrouver votre fiche Équipe (e-mail du compte ≠ Equipe.E_mail, ou e-mail illisible). Demandez à un Owner d’aligner l’e-mail et de corriger la règle Access Rules E_mail (refus hors soi, comme pour le TJM).",
    );
  }

  const members = recordsFromFetchTable(equipeResult.value).map(toEquipeMember);

  const failed: string[] = [];
  const pick = <T>(
    index: number,
    label: string,
    map: (raw: GristFetchTableResult) => T[],
  ): T[] => {
    const result = settled[index];
    if (result?.status === "fulfilled") {
      return map(result.value);
    }
    failed.push(label);
    return [];
  };

  const missions = pick(1, "Missions", (raw) =>
    recordsFromFetchTable(raw).map(toMission),
  );
  if (settled[1]?.status === "rejected") {
    const reason = settled[1].reason;
    throw reason instanceof Error ? reason : new Error("Lecture Missions impossible.");
  }

  const missionEnfants = pick(2, "Missions_enfants", (raw) =>
    recordsFromFetchTable(raw).map(toMissionEnfant),
  );
  const suivi = pick(3, "Realise", (raw) =>
    recordsFromFetchTable(raw).map(toSuiviMensuel),
  );

  return {
    refsError:
      failed.length > 0
        ? `Référentiels partiels : ${failed.join(", ")} indisponible(s).`
        : null,
    manager,
    members,
    missions,
    missionEnfants,
    suivi,
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
