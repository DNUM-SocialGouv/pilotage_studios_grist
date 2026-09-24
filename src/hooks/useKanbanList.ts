import { useCallback, useEffect, useState } from "react";
import { useGristPa } from "../GristPaContext";
import { recordsFromFetchTable } from "../gristMap";
import { getEmbedTrust } from "../security/embedTrust";
import { fetchAllowlistedTable, KANBAN_TABLE_ID } from "../security/fetchTableAllowlist";
import {
  filterFeedbackColumn,
  groupProductByKanban,
  kanbanTicketFromRecord,
  type KanbanProductGroup,
  type KanbanTicket,
} from "../utils/kanbanTickets";

export type KanbanListStatus = "loading" | "ok" | "empty" | "error" | "standalone";

export type KanbanListData = {
  status: KanbanListStatus;
  items: KanbanTicket[];
  feedbackItems: KanbanTicket[];
  productGroups: KanbanProductGroup[];
  error: string | null;
  /** Recharge après create feedback / update colonne. */
  reload: () => void;
};

const INITIAL_GROUPS = groupProductByKanban([]);

const FETCH_MAX_ATTEMPTS = 3;
const FETCH_RETRY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Charge la table `Kanban` pour l’accueil (Feedback + Backlog / En cours / Livré).
 * Attend la fin du boot PA avant le premier `fetchTable`.
 */
export function useKanbanList(): KanbanListData {
  const pa = useGristPa();
  const [status, setStatus] = useState<KanbanListStatus>("loading");
  const [items, setItems] = useState<KanbanTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    const trust = getEmbedTrust();
    if (trust === "standalone" || trust === "untrusted") {
      setStatus("standalone");
      setItems([]);
      setError(null);
      return;
    }

    if (pa.untrustedEmbed || pa.outsideGrist) {
      setStatus("standalone");
      setItems([]);
      setError(null);
      return;
    }

    if (pa.loading) {
      setStatus("loading");
      return;
    }

    let cancelled = false;

    const load = async () => {
      let lastError: string | null = null;
      for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt += 1) {
        try {
          const raw = await fetchAllowlistedTable(KANBAN_TABLE_ID);
          if (cancelled) {
            return;
          }
          const rows = recordsFromFetchTable(raw);
          const next = rows.map((row) =>
            kanbanTicketFromRecord(row as Record<string, unknown> & { id: number }),
          );
          setItems(next);
          setStatus(next.length === 0 ? "empty" : "ok");
          setError(null);
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
      setItems([]);
      setStatus("error");
      setError(lastError ?? "Lecture du kanban impossible.");
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [pa.loading, pa.outsideGrist, pa.untrustedEmbed, reloadToken]);

  return {
    status,
    items,
    feedbackItems: filterFeedbackColumn(items),
    productGroups: groupProductByKanban(items),
    error,
    reload,
  };
}

export { INITIAL_GROUPS as emptyKanbanProductGroups };
