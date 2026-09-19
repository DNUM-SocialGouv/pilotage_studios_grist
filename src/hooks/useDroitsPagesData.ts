import { useCallback, useEffect, useState } from "react";
import { recordsFromFetchTable } from "../gristMap";
import { useGristPa } from "../GristPaContext";
import {
  DROITS_PAGES_TABLE_ID,
  fetchAllowlistedTable,
} from "../security/fetchTableAllowlist";
import {
  pageAccessFromRecord,
  type PageAccessFlags,
} from "../security/pageAccess";
import {
  DROITS_PAGES_ROLE_ORDER,
  type DroitsPagesRoleName,
} from "../utils/droitsPagesThemes";

export type DroitsPagesRow = {
  id: number;
  role: DroitsPagesRoleName;
  flags: PageAccessFlags;
};

export type DroitsPagesDataStatus = "idle" | "loading" | "ok" | "error";

export type DroitsPagesData = {
  status: DroitsPagesDataStatus;
  rows: DroitsPagesRow[];
  error: string | null;
  reload: () => void;
  /** Met à jour le cache local après une écriture vérifiée (sans re-fetch). */
  patchRow: (id: number, flags: PageAccessFlags) => void;
};

function roleNameFromRaw(raw: unknown): DroitsPagesRoleName | null {
  const label =
    typeof raw === "string"
      ? raw.trim()
      : raw != null && typeof raw === "object" && "toString" in raw
        ? String(raw).trim()
        : "";
  if ((DROITS_PAGES_ROLE_ORDER as readonly string[]).includes(label)) {
    return label as DroitsPagesRoleName;
  }
  return null;
}

function mapRows(rawRows: { id: number; [k: string]: unknown }[]): DroitsPagesRow[] {
  const byRole = new Map<DroitsPagesRoleName, DroitsPagesRow>();
  for (const row of rawRows) {
    const role = roleNameFromRaw(row.Role);
    if (!role) {
      continue;
    }
    const fields: Record<string, unknown> = { ...row };
    delete fields.id;
    byRole.set(role, {
      id: row.id,
      role,
      flags: pageAccessFromRecord(fields),
    });
  }
  return DROITS_PAGES_ROLE_ORDER.flatMap((role) => {
    const found = byRole.get(role);
    return found ? [found] : [];
  });
}

/**
 * Charge `Droits_pages` (lazy) — réservé Admin côté ACL Grist.
 * Ne vide pas le cache si `enabled` passe brièvement à false (évite d’écraser un brouillon).
 */
export function useDroitsPagesData(enabled: boolean): DroitsPagesData {
  const pa = useGristPa();
  const [status, setStatus] = useState<DroitsPagesDataStatus>("idle");
  const [rows, setRows] = useState<DroitsPagesRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  const patchRow = useCallback((id: number, flags: PageAccessFlags) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, flags: { ...flags } } : row)),
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (pa.outsideGrist || pa.untrustedEmbed) {
      setStatus("error");
      setRows([]);
      setError("Lecture Droits_pages indisponible hors iframe Grist.");
      return;
    }

    let cancelled = false;
    setStatus((prev) => (prev === "ok" ? "ok" : "loading"));
    setError(null);

    const load = async () => {
      try {
        const raw = await fetchAllowlistedTable(DROITS_PAGES_TABLE_ID);
        if (cancelled) {
          return;
        }
        const mapped = mapRows(recordsFromFetchTable(raw));
        if (mapped.length === 0) {
          setStatus("error");
          setRows([]);
          setError("Aucune ligne Droits_pages lisible (vérifiez les Access Rules).");
          return;
        }
        setRows(mapped);
        setStatus("ok");
      } catch (err) {
        if (cancelled) {
          return;
        }
        setStatus("error");
        setRows([]);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, pa.outsideGrist, pa.untrustedEmbed, reloadToken]);

  return { status, rows, error, reload, patchRow };
}
