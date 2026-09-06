import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { BDC, CommandeSofiane, Constatation, PlanActivite } from "../types";
import type { GristRecord } from "../gristTypes";
import {
  recordsFromFetchTable,
  toBdc,
  toCommandeSofiane,
  toConstatation,
  toPlanActivite,
} from "../gristMap";
import { getEmbedTrust, type EmbedTrust } from "../security/embedTrust";
import {
  fetchAllowlistedTable,
  PA_TABLE_ID,
  RELATED_TABLE_IDS,
} from "../security/fetchTableAllowlist";
import { fetchGristRecordsViaToken } from "../utils/gristRest";

export type RelatedTablesStatus = "idle" | "loading" | "ok" | "denied" | "error";

export type GristPaData = {
  connected: boolean;
  outsideGrist: boolean;
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

/**
 * BDC via REST + getAccessToken (même forme que l’app sœur) pour ne pas perdre
 * Attachments / URLs parfois absents ou tronqués via `docApi.fetchTable`.
 * Repli sur fetchTable si le jeton est indisponible.
 */
async function fetchBdcList(): Promise<BDC[]> {
  try {
    const rows = await fetchGristRecordsViaToken("BDC");
    return rows.map((row) => toBdc(row as GristRecord));
  } catch {
    const bdcRaw = await fetchAllowlistedTable("BDC");
    return recordsFromFetchTable(bdcRaw).map(toBdc);
  }
}

async function fetchRelatedTables(): Promise<{
  bdcList: BDC[];
  constatations: Constatation[];
  commandes: CommandeSofiane[];
}> {
  const [bdcList, pvRaw, cmdRaw] = await Promise.all([
    fetchBdcList(),
    fetchAllowlistedTable(RELATED_TABLE_IDS[1]),
    fetchAllowlistedTable(RELATED_TABLE_IDS[2]),
  ]);
  return {
    bdcList,
    constatations: recordsFromFetchTable(pvRaw).map(toConstatation),
    commandes: recordsFromFetchTable(cmdRaw).map(toCommandeSofiane),
  };
}

async function fetchPlansFromDocApi(): Promise<PlanActivite[]> {
  const raw = await fetchAllowlistedTable(PA_TABLE_ID);
  return recordsFromFetchTable(raw).map(toPlanActivite);
}

function applyPlans(
  records: GristRecord[],
  trust: EmbedTrust,
  setState: Dispatch<SetStateAction<GristPaData>>,
  loadRelated: () => Promise<void>,
) {
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
}

/**
 * Ordre Grist critique : `onRecords` puis `ready` (jamais ready trop tôt).
 * `onRecords` ne renvoie que les colonnes du view section — on hydrate aussi via
 * `docApi.fetchTable('Plan_activite')` (accès full, toutes les colonnes).
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

    if (trust === "standalone") {
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
    let attempts = 0;
    const maxAttempts = 50;

    const tryConnect = () => {
      if (cancelled) {
        return;
      }
      const grist = window.grist;
      if (!grist?.ready || !grist.onRecords || !grist.docApi?.fetchTable) {
        attempts += 1;
        if (attempts < maxAttempts) {
          window.setTimeout(tryConnect, 100);
          return;
        }
        setState({
          ...EMPTY,
          loading: false,
          outsideGrist: true,
          embedTrust: trust,
          connected: false,
          error:
            "API Grist indisponible (script bloqué ou hors iframe). Vérifiez la CSP et l’URL du widget.",
        });
        return;
      }

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

      // 1) S’abonner AVANT ready
      grist.onRecords((records) => {
        if (cancelled) {
          return;
        }
        applyPlans(records, trust, setState, loadRelated);
      });

      // 2) Puis signaler prêt
      grist.ready({ requiredAccess: "full" });

      // 3) Hydratation forcée (toutes colonnes) — ne dépend pas des « Colonnes visibles »
      void (async () => {
        try {
          const plans = await fetchPlansFromDocApi();
          if (cancelled) {
            return;
          }
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
          await loadRelated();
        } catch (err) {
          if (cancelled) {
            return;
          }
          // Si fetchTable échoue, on attend encore onRecords ; timeout UI
          window.setTimeout(() => {
            if (cancelled) {
              return;
            }
            setState((prev) => {
              if (!prev.loading) {
                return prev;
              }
              const message = err instanceof Error ? err.message : String(err);
              return {
                ...prev,
                loading: false,
                error: `Chargement PA échoué (${message}). Cochez des colonnes visibles ou vérifiez l’accès full.`,
                connected: false,
              };
            });
          }, 3000);
        }
      })();
    };

    tryConnect();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
