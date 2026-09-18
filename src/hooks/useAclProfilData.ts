import { useEffect, useState } from "react";
import { recordsFromFetchTable } from "../gristMap";
import { getEmbedTrust } from "../security/embedTrust";
import { fetchAllowlistedTable } from "../security/fetchTableAllowlist";
import {
  PAGE_ACCESS_ALL_OPEN,
  PAGE_ACCESS_FAIL_CLOSED,
  pageAccessFromRecord,
  type PageAccessFlags,
} from "../security/pageAccess";

export type AclProfilStatus = "loading" | "ok" | "empty" | "error" | "standalone";

export type AclProfilData = {
  status: AclProfilStatus;
  role: string | null;
  flags: PageAccessFlags;
  error: string | null;
};

const INITIAL: AclProfilData = {
  status: "loading",
  role: null,
  flags: PAGE_ACCESS_FAIL_CLOSED,
  error: null,
};

function roleFromRecord(fields: Record<string, unknown>): string | null {
  const raw = fields.Role;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim();
  }
  if (raw != null && typeof raw === "object" && "toString" in raw) {
    const label = String(raw).trim();
    if (label && label !== "CENSORED" && !label.startsWith("[")) {
      return label;
    }
  }
  return null;
}

/**
 * Charge la ligne `Acl_profil` visible pour l’utilisateur courant (ACL serveur).
 * Hors iframe / standalone : tous les écrans ouverts (préview locale).
 */
export function useAclProfilData(): AclProfilData {
  const [state, setState] = useState<AclProfilData>(INITIAL);

  useEffect(() => {
    const trust = getEmbedTrust();
    if (trust === "standalone" || trust === "untrusted") {
      setState({
        status: "standalone",
        role: null,
        flags: PAGE_ACCESS_ALL_OPEN,
        error: null,
      });
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 50;

    const load = async () => {
      try {
        const raw = await fetchAllowlistedTable("Acl_profil");
        if (cancelled) {
          return;
        }
        const rows = recordsFromFetchTable(raw);
        if (rows.length === 0) {
          setState({
            status: "empty",
            role: null,
            flags: PAGE_ACCESS_FAIL_CLOSED,
            error: null,
          });
          return;
        }
        const row = rows[0]!;
        const fields: Record<string, unknown> = { ...row };
        delete fields.id;
        setState({
          status: "ok",
          role: roleFromRecord(fields),
          flags: pageAccessFromRecord(fields),
          error: null,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setState({
          status: "error",
          role: null,
          flags: PAGE_ACCESS_FAIL_CLOSED,
          error: message,
        });
      }
    };

    const tryConnect = () => {
      if (cancelled) {
        return;
      }
      const grist = window.grist;
      if (!grist?.docApi?.fetchTable) {
        attempts += 1;
        if (attempts < maxAttempts) {
          window.setTimeout(tryConnect, 100);
          return;
        }
        setState({
          status: "error",
          role: null,
          flags: PAGE_ACCESS_FAIL_CLOSED,
          error: "API Grist indisponible pour lire Acl_profil.",
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
