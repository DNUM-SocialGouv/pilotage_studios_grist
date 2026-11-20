import { useCallback, useEffect, useRef, useState } from "react";
import type { GristRecord } from "../gristTypes.ts";
import { recordsFromFetchTable, toIntervenant, toMissionEnfant } from "../gristMap.ts";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist.ts";
import type { Intervenant, MissionEnfant } from "../types.ts";
import {
  portageProjetAdminFromRecord,
  type PortageProjetAdminRow,
} from "../utils/portageProjetFormFields.ts";

export type PortageProjetAdminStatus = "idle" | "loading" | "ok" | "error";

export type PortageProjetAdminData = {
  status: PortageProjetAdminStatus;
  error: string | null;
  /** Équipe ou prestations illisibles : la liste reste, la suppression est bloquée si besoin. */
  refsWarning: string | null;
  rows: PortageProjetAdminRow[];
  members: Intervenant[];
  /** Faux si l’annuaire Équipe n’a pas pu être lu. */
  membersReady: boolean;
  prestations: MissionEnfant[];
  /** Faux si la table Prestations n’a pas pu être lue — pas de suppression. */
  prestationsReady: boolean;
  isReloading: boolean;
  reload: () => Promise<{
    rows: PortageProjetAdminRow[];
    members: Intervenant[];
    membersReady: boolean;
  }>;
  /** Relit uniquement les prestations, juste avant une suppression. */
  reloadLinks: () => Promise<MissionEnfant[]>;
};

type Loaded = {
  rows: PortageProjetAdminRow[];
  members: Intervenant[];
  membersReady: boolean;
  prestations: MissionEnfant[];
  prestationsReady: boolean;
  refsWarning: string | null;
};

async function loadPortageProjetAdmin(): Promise<Loaded> {
  const settled = await Promise.allSettled([
    fetchAllowlistedTable("Portage_Projet"),
    fetchAllowlistedTable("Equipe"),
    fetchAllowlistedTable("Prestations"),
  ]);

  const portage = settled[0];
  if (portage?.status !== "fulfilled") {
    const reason = portage?.status === "rejected" ? portage.reason : null;
    throw reason instanceof Error
      ? reason
      : new Error("La liste des portages n’a pas pu être chargée.");
  }

  const warnings: string[] = [];
  let members: Intervenant[] = [];
  let membersReady = false;
  if (settled[1]?.status === "fulfilled") {
    members = recordsFromFetchTable(settled[1].value).map((row) =>
      toIntervenant(row as GristRecord),
    );
    membersReady = true;
  } else {
    warnings.push("l’annuaire Équipe");
  }

  let prestations: MissionEnfant[] = [];
  let prestationsReady = false;
  if (settled[2]?.status === "fulfilled") {
    prestations = recordsFromFetchTable(settled[2].value).map((row) =>
      toMissionEnfant(row as GristRecord),
    );
    prestationsReady = true;
  } else {
    warnings.push("les prestations");
  }

  return {
    rows: recordsFromFetchTable(portage.value).map((row) =>
      portageProjetAdminFromRecord(row as GristRecord),
    ),
    members,
    membersReady,
    prestations,
    prestationsReady,
    refsWarning:
      warnings.length > 0
        ? `Lecture incomplète : ${warnings.join(" et ")}. ${
            prestationsReady
              ? "Les noms de personnes peuvent manquer."
              : "La suppression est désactivée tant que les rattachements ne sont pas vérifiables."
          }`
        : null,
  };
}

export function usePortageProjetAdminData(): PortageProjetAdminData {
  const [status, setStatus] = useState<PortageProjetAdminStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [refsWarning, setRefsWarning] = useState<string | null>(null);
  const [rows, setRows] = useState<PortageProjetAdminRow[]>([]);
  const [members, setMembers] = useState<Intervenant[]>([]);
  const [membersReady, setMembersReady] = useState(false);
  const [prestations, setPrestations] = useState<MissionEnfant[]>([]);
  const [prestationsReady, setPrestationsReady] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const hasLoadedRef = useRef(false);

  const apply = (loaded: Loaded) => {
    setRows(loaded.rows);
    setMembers(loaded.members);
    setMembersReady(loaded.membersReady);
    setPrestations(loaded.prestations);
    setPrestationsReady(loaded.prestationsReady);
    setRefsWarning(loaded.refsWarning);
    setError(null);
    setStatus("ok");
    hasLoadedRef.current = true;
  };

  const reloadLinks = useCallback(async () => {
    try {
      const table = await fetchAllowlistedTable("Prestations");
      const next = recordsFromFetchTable(table).map((row) => toMissionEnfant(row as GristRecord));
      setPrestations(next);
      setPrestationsReady(true);
      return next;
    } catch (err) {
      setPrestationsReady(false);
      throw err instanceof Error
        ? err
        : new Error("Les prestations n’ont pas pu être lues.");
    }
  }, []);

  const reload = useCallback(async () => {
    setIsReloading(true);
    try {
      const loaded = await loadPortageProjetAdmin();
      apply(loaded);
      return loaded;
    } catch (err) {
      if (!hasLoadedRef.current) {
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : "La liste des portages n’a pas pu être chargée.",
        );
      }
      throw err;
    } finally {
      setIsReloading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    void (async () => {
      try {
        const loaded = await loadPortageProjetAdmin();
        if (cancelled) {
          return;
        }
        setRows(loaded.rows);
        setMembers(loaded.members);
        setMembersReady(loaded.membersReady);
        setPrestations(loaded.prestations);
        setPrestationsReady(loaded.prestationsReady);
        setRefsWarning(loaded.refsWarning);
        setError(null);
        setStatus("ok");
        hasLoadedRef.current = true;
      } catch (err) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : "La liste des portages n’a pas pu être chargée.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    status,
    error,
    refsWarning,
    rows,
    members,
    membersReady,
    prestations,
    prestationsReady,
    isReloading,
    reload,
    reloadLinks,
  };
}
