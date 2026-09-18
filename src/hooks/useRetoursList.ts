import { useEffect, useState } from "react";
import { useGristPa } from "../GristPaContext";
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

const FETCH_MAX_ATTEMPTS = 3;
const FETCH_RETRY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Charge `Retours` pour la colonne Feedback de l’accueil.
 * Attend la fin du boot PA (`grist.ready`) avant le premier `fetchTable`.
 * Hors iframe : liste vide (pas de faux tickets).
 */
export function useRetoursList(): RetoursListData {
  const pa = useGristPa();
  const [state, setState] = useState<RetoursListData>(INITIAL);

  useEffect(() => {
    const trust = getEmbedTrust();
    if (trust === "standalone" || trust === "untrusted") {
      setState({ status: "standalone", items: [], error: null });
      return;
    }

    if (pa.untrustedEmbed || pa.outsideGrist) {
      setState({ status: "standalone", items: [], error: null });
      return;
    }

    if (pa.loading) {
      setState((prev) => (prev.status === "loading" ? prev : INITIAL));
      return;
    }

    let cancelled = false;

    const load = async () => {
      let lastError: string | null = null;
      for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt += 1) {
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
          return;
        } catch (err) {
          if (cancelled) {
            return;
          }
          lastError = err instanceof Error ? err.message : String(err);
          if (attempt < FETCH_MAX_ATTEMPTS) {
            await sleep(FETCH_RETRY_MS);
          }
        }
      }
      if (cancelled) {
        return;
      }
      setState({
        status: "error",
        items: [],
        error: lastError ?? "Lecture des retours impossible.",
      });
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [pa.loading, pa.outsideGrist, pa.untrustedEmbed]);

  return state;
}
