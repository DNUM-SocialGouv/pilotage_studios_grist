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
  prestations: MissionEnfant[];
  /** Faux si la table Prestations n’a pas pu être lue — pas de suppression. */
  prestationsReady: boolean;
  isReloading: boolean;
  reload: () => Promise<void>;
};

type Loaded = {
  rows: PortageProjetAdminRow[];
  members: Intervenant[];
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
      : new Error("La liste des projets de portage n’a pas pu être chargée.");
  }

  const warnings: string[] = [];
  let members: Intervenant[] = [];
  if (settled[1]?.status === "fulfilled") {
    members = recordsFromFetchTable(settled[1].value).map((row) =>
      toIntervenant(row as GristRecord),
    );
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
  const [prestations, setPrestations] = useState<MissionEnfant[]>([]);
  const [prestationsReady, setPrestationsReady] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const hasLoadedRef = useRef(false);

  const apply = (loaded: Loaded) => {
    setRows(loaded.rows);
    setMembers(loaded.members);
    setPrestations(loaded.prestations);
    setPrestationsReady(loaded.prestationsReady);
    setRefsWarning(loaded.refsWarning);
    setError(null);
    setStatus("ok");
    hasLoadedRef.current = true;
  };

  const reload = useCallback(async () => {
    setIsReloading(true);
    try {
      apply(await loadPortageProjetAdmin());
    } catch (err) {
      if (!hasLoadedRef.current) {
        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : "La liste des projets de portage n’a pas pu être chargée.",
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
            : "La liste des projets de portage n’a pas pu être chargée.",
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
    prestations,
    prestationsReady,
    isReloading,
    reload,
  };
}
