/**
 * Lecture lazy de `Weekly_coachs` (allowlist e-mails coachs — hors repo).
 */

import { useEffect, useState } from "react";
import { recordsFromFetchTable } from "../gristMap";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import {
  weeklyCoachEmailSetFromRows,
} from "../utils/weeklyCoachAccess";

export type WeeklyCoachAllowlistStatus = "idle" | "loading" | "ok" | "error";

export type WeeklyCoachAllowlistState = {
  status: WeeklyCoachAllowlistStatus;
  emails: ReadonlySet<string>;
  error: string | null;
};

const EMPTY = new Set<string>();

export function useWeeklyCoachAllowlist(enabled: boolean): WeeklyCoachAllowlistState {
  const [status, setStatus] = useState<WeeklyCoachAllowlistStatus>("idle");
  const [emails, setEmails] = useState<ReadonlySet<string>>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setEmails(EMPTY);
      setError(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    void (async () => {
      try {
        const raw = await fetchAllowlistedTable("Weekly_coachs");
        if (cancelled) return;
        const rows = recordsFromFetchTable(raw).map((r) => ({
          E_mail:
            typeof r.E_mail === "string"
              ? r.E_mail
              : r.E_mail != null
                ? String(r.E_mail)
                : null,
        }));
        setEmails(weeklyCoachEmailSetFromRows(rows));
        setStatus("ok");
      } catch (e) {
        if (cancelled) return;
        setEmails(EMPTY);
        setStatus("error");
        setError(
          e instanceof Error
            ? e.message
            : "Impossible de charger la liste des coachs Weekly.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { status, emails, error };
}
