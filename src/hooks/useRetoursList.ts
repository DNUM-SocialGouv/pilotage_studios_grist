import { useEffect, useState } from "react";
import { recordsFromFetchTable } from "../gristMap";
import { getEmbedTrust } from "../security/embedTrust";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import {
  retourKanbanItemFromRecord,
  sortRetoursNewestFirst,
  type RetourKanbanItem,
} from "../utils/retoursKanban";

export type RetoursListStatus = "loading" | "ok" | "empty" | "error" | "standalone";

export type RetoursListData = {
  status: RetoursListStatus;
  items: RetourKanbanItem[];
  error: string | null;
};

const INITIAL: RetoursListData = {
  status: "loading",
  items: [],
  error: null,
};

/**
 * Charge `Retours` pour la colonne Feedback de l’accueil.
 * Hors iframe : liste vide (pas de faux tickets).
 */
export function useRetoursList(): RetoursListData {
  const [state, setState] = useState<RetoursListData>(INITIAL);

  useEffect(() => {
    const trust = getEmbedTrust();
    if (trust === "standalone" || trust === "untrusted") {
      setState({ status: "standalone", items: [], error: null });
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 50;

    const load = async () => {
      try {
        const raw = await fetchAllowlistedTable("Retours");
        if (cancelled) {
          return;
        }
        const rows = recordsFromFetchTable(raw);
        const items = sortRetoursNewestFirst(
          rows.map((row) =>
            retourKanbanItemFromRecord(row as Record<string, unknown> & { id: number }),
          ),
        );
        setState({
          status: items.length === 0 ? "empty" : "ok",
          items,
          error: null,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", items: [], error: message });
      }
    };

    const tryConnect = () => {
      if (cancelled) {
        return;
      }
      if (!window.grist?.docApi?.fetchTable) {
        attempts += 1;
        if (attempts < maxAttempts) {
          window.setTimeout(tryConnect, 100);
          return;
        }
        setState({
          status: "error",
          items: [],
          error: "API Grist indisponible pour lire les retours.",
        });
        return;
      }
      void load();
    };

    tryConnect();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
