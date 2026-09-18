import { useEffect, useState } from "react";
import { useGristPa } from "../GristPaContext";
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

const FETCH_MAX_ATTEMPTS = 3;
const FETCH_RETRY_MS = 250;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Charge la ligne `Acl_profil` visible pour l’utilisateur courant (ACL serveur).
 * Attend la fin du boot PA (`grist.ready`) avant le premier `fetchTable`.
 * Hors iframe / standalone : tous les écrans ouverts (préview locale).
 */
export function useAclProfilData(): AclProfilData {
  const pa = useGristPa();
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

    if (pa.untrustedEmbed) {
      setState({
        status: "error",
        role: null,
        flags: PAGE_ACCESS_FAIL_CLOSED,
        error: "Embed non autorisé : profil d’accès indisponible.",
      });
      return;
    }

    if (pa.outsideGrist) {
      setState({
        status: "standalone",
        role: null,
        flags: PAGE_ACCESS_ALL_OPEN,
        error: null,
      });
      return;
    }

    // Attendre que useGristPaData ait appelé grist.ready (évite fetchTable trop tôt).
    if (pa.loading) {
      setState((prev) => (prev.status === "loading" ? prev : INITIAL));
      return;
    }

    let cancelled = false;

    const load = async () => {
      let lastError: string | null = null;
      for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt += 1) {
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
        role: null,
        flags: PAGE_ACCESS_FAIL_CLOSED,
        error: lastError ?? "Lecture Acl_profil impossible.",
      });
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [pa.loading, pa.outsideGrist, pa.untrustedEmbed]);

  return state;
}
