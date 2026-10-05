/**
 * Charge Kanban + commentaires pour le bloc « Vos retours » (accueil).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useGristPa } from "../GristPaContext";
import { recordsFromFetchTable } from "../gristMap";
import { getEmbedTrust } from "../security/embedTrust";
import {
  fetchAllowlistedTable,
  KANBAN_TABLE_ID,
} from "../security/fetchTableAllowlist";
import { KANBAN_COMMENTAIRES_TABLE_ID } from "../security/writeTableAllowlist";
import {
  kanbanCommentaireFromRecord,
  type KanbanCommentaireItem,
} from "../utils/kanbanCommentaires";
import { kanbanTicketFromRecord, type KanbanTicket } from "../utils/kanbanTickets";
import {
  buildVosRetoursItems,
  shouldShowVosRetoursBlock,
  type VosRetourItem,
} from "../utils/vosRetours";
import {
  loadVosRetoursLastSeen,
  markVosRetourSeen,
  type VosRetoursLastSeenMap,
} from "../utils/vosRetoursLastSeen";
import type { WelcomeRoleKind } from "../utils/welcomeHomeByRole";

export type VosRetoursStatus = "hidden" | "loading" | "ok" | "empty" | "error" | "standalone";

export type VosRetoursData = {
  visible: boolean;
  status: VosRetoursStatus;
  items: VosRetourItem[];
  error: string | null;
  reload: () => void;
  /** Marque lu (localStorage) à l’ouverture du drawer. */
  markSeen: (ticket: KanbanTicket) => void;
};

const FETCH_MAX_ATTEMPTS = 3;
const FETCH_RETRY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type UseVosRetoursArgs = {
  sessionEmail: string | null;
  profilKind: WelcomeRoleKind;
};

/**
 * Données du bloc « Vos retours ». Masqué si e-mail / profil non fiables.
 */
export function useVosRetours({
  sessionEmail,
  profilKind,
}: UseVosRetoursArgs): VosRetoursData {
  const pa = useGristPa();
  const visible = shouldShowVosRetoursBlock(sessionEmail, profilKind);
  const [status, setStatus] = useState<VosRetoursStatus>("loading");
  const [tickets, setTickets] = useState<KanbanTicket[]>([]);
  const [comments, setComments] = useState<KanbanCommentaireItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [lastSeen, setLastSeen] = useState<VosRetoursLastSeenMap>(() =>
    loadVosRetoursLastSeen(),
  );

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  const markSeen = useCallback((ticket: KanbanTicket) => {
    setLastSeen(markVosRetourSeen(ticket.id, ticket.column));
  }, []);

  useEffect(() => {
    if (!visible) {
      setStatus("hidden");
      setTickets([]);
      setComments([]);
      setError(null);
      return;
    }

    const trust = getEmbedTrust();
    if (trust === "standalone" || trust === "untrusted") {
      setStatus("standalone");
      setTickets([]);
      setComments([]);
      setError(null);
      return;
    }

    if (pa.untrustedEmbed || pa.outsideGrist) {
      setStatus("standalone");
      setTickets([]);
      setComments([]);
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
          const [rawKanban, rawComments] = await Promise.all([
            fetchAllowlistedTable(KANBAN_TABLE_ID),
            fetchAllowlistedTable(KANBAN_COMMENTAIRES_TABLE_ID),
          ]);
          if (cancelled) return;
          const nextTickets = recordsFromFetchTable(rawKanban).map((row) =>
            kanbanTicketFromRecord(row as Record<string, unknown> & { id: number }),
          );
          const nextComments = recordsFromFetchTable(rawComments)
            .map((row) =>
              kanbanCommentaireFromRecord(row as Record<string, unknown> & { id: number }),
            )
            .filter((item): item is KanbanCommentaireItem => item != null);
          setTickets(nextTickets);
          setComments(nextComments);
          setError(null);
          setStatus(nextTickets.length === 0 ? "empty" : "ok");
          return;
        } catch (err) {
          if (cancelled) return;
          lastError = err instanceof Error ? err.message : String(err);
          if (attempt < FETCH_MAX_ATTEMPTS) {
            await sleep(FETCH_RETRY_MS);
          }
        }
      }
      if (cancelled) return;
      setTickets([]);
      setComments([]);
      setStatus("error");
      setError(lastError ?? "Lecture de vos retours impossible.");
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    visible,
    pa.loading,
    pa.outsideGrist,
    pa.untrustedEmbed,
    reloadToken,
  ]);

  const items = useMemo(() => {
    if (!visible) return [];
    return buildVosRetoursItems({
      tickets,
      comments,
      sessionEmail,
      lastSeen,
    });
  }, [visible, tickets, comments, sessionEmail, lastSeen]);

  const resolvedStatus: VosRetoursStatus = !visible
    ? "hidden"
    : status === "ok" && items.length === 0
      ? "empty"
      : status;

  return {
    visible,
    status: resolvedStatus,
    items,
    error,
    reload,
    markSeen,
  };
}
