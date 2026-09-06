import { useEffect, useState } from "react";
import type { BDC, CommandeSofiane, Constatation, PlanActivite } from "../types";
import {
  recordsFromFetchTable,
  toBdc,
  toCommandeSofiane,
  toConstatation,
  toPlanActivite,
} from "../gristMap";
import { getEmbedTrust, type EmbedTrust } from "../security/embedTrust";

export type RelatedTablesStatus = "idle" | "loading" | "ok" | "denied" | "error";

export type GristPaData = {
  connected: boolean;
  outsideGrist: boolean;
  /** Iframe sous un parent non autorisé. */
  untrustedEmbed: boolean;
  embedTrust: EmbedTrust;
  loading: boolean;
  error: string | null;
  plans: PlanActivite[];
  bdcList: BDC[];
  constatations: Constatation[];
  commandes: CommandeSofiane[];
  relatedStatus: RelatedTablesStatus;
  relatedError: string | null;
};

const EMPTY: GristPaData = {
  connected: false,
  outsideGrist: false,
  untrustedEmbed: false,
  embedTrust: "standalone",
  loading: true,
  error: null,
  plans: [],
  bdcList: [],
  constatations: [],
  commandes: [],
  relatedStatus: "idle",
  relatedError: null,
};

/** Tables liées autorisées en lecture (allowlist — pas de fetchTable arbitraire). */
const RELATED_TABLE_IDS = ["BDC", "Constatations", "Commandes_Sofiane"] as const;

async function fetchRelatedTables(): Promise<{
  bdcList: BDC[];
  constatations: Constatation[];
  commandes: CommandeSofiane[];
}> {
  const grist = window.grist;
  if (!grist?.docApi?.fetchTable) {
    throw new Error("docApi.fetchTable indisponible");
  }
  const [bdcRaw, pvRaw, cmdRaw] = await Promise.all(
    RELATED_TABLE_IDS.map((id) => grist.docApi.fetchTable(id)),
  );
  return {
    bdcList: recordsFromFetchTable(bdcRaw).map(toBdc),
    constatations: recordsFromFetchTable(pvRaw).map(toConstatation),
    commandes: recordsFromFetchTable(cmdRaw).map(toCommandeSofiane),
  };
}

/**
 * Branche `grist.ready` + `onRecords` uniquement si l’embed est de confiance.
 * Lecture seule métier : pas d’API d’écriture exposée dans ce module.
 */
export function useGristPaData(): GristPaData {
  const [state, setState] = useState<GristPaData>(EMPTY);

  useEffect(() => {
    const trust = getEmbedTrust();

    if (trust === "untrusted") {
      setState({
        ...EMPTY,
        loading: false,
        untrustedEmbed: true,
        embedTrust: trust,
        error: "Embed non autorisé : ce widget ne s’active que dans Grist (numerique.gouv.fr).",
      });
      return;
    }

    const grist = window.grist;
    if (trust === "standalone" || !grist?.ready || !grist.onRecords) {
      setState({
        ...EMPTY,
        loading: false,
        outsideGrist: true,
        embedTrust: trust,
        connected: false,
        error: null,
      });
      return;
    }

    let cancelled = false;

    const loadRelated = async () => {
      setState((prev) => ({
        ...prev,
        relatedStatus: "loading",
        relatedError: null,
      }));
      try {
        const related = await fetchRelatedTables();
        if (cancelled) {
          return;
        }
        setState((prev) => ({
          ...prev,
          ...related,
          relatedStatus: "ok",
          relatedError: null,
        }));
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          bdcList: [],
          constatations: [],
          commandes: [],
          relatedStatus: "denied",
          relatedError: message,
        }));
      }
    };

    // full = lecture tables liées ; aucune écriture dans ce widget V1
    grist.ready({ requiredAccess: "full" });
    grist.onRecords((records) => {
      if (cancelled) {
        return;
      }
      const plans = records.map(toPlanActivite);
      setState((prev) => ({
        ...prev,
        connected: true,
        outsideGrist: false,
        untrustedEmbed: false,
        embedTrust: trust,
        loading: false,
        error: null,
        plans,
      }));
      void loadRelated();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
