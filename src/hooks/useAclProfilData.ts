import { useCallback, useEffect, useState } from "react";
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
import { createOwnAclProfilRecord } from "../utils/aclProfilGristWrite";
import {
  emailFromAclProfilFields,
  pickAclProfilRow,
} from "../utils/aclProfilPick";
import { resolveGristUserEmail } from "../utils/gristUserEmail";
import { findSelfEquipeFromTable } from "../utils/resolveSelfEquipeId";

export type AclProfilStatus = "loading" | "ok" | "empty" | "error" | "standalone";

export type AclProfilData = {
  status: AclProfilStatus;
  role: string | null;
  /** E_mail de la fiche Acl_profil (session) — fiable même si le jeton REST n’expose pas l’e-mail. */
  email: string | null;
  /**
   * Département (`Equipe.Equipe`) de la fiche Équipe matchée — pour masquer
   * « Revue CRA équipe » si vide (cas admin transverse).
   */
  equipeLabel: string | null;
  flags: PageAccessFlags;
  error: string | null;
  /** Recharge la fiche session (après update `Droits_pages`). */
  refresh: () => void;
};

const INITIAL_WITHOUT_REFRESH: Omit<AclProfilData, "refresh"> = {
  status: "loading",
  role: null,
  email: null,
  equipeLabel: null,
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

async function resolveEquipeLabelForEmail(
  email: string | null,
): Promise<string | null> {
  if (!email?.includes("@")) {
    return null;
  }
  try {
    const table = await fetchAllowlistedTable("Equipe");
    const self = findSelfEquipeFromTable(table, email);
    const label = self?.equipeLabel?.trim() ?? "";
    return label || null;
  } catch {
    return null;
  }
}

/**
 * Charge la ligne `Acl_profil` visible pour l’utilisateur courant (ACL serveur).
 * Si absente : crée automatiquement la fiche (E_mail = compte connecté), puis relit.
 * Hors iframe / standalone : tous les écrans ouverts (préview locale).
 */
export function useAclProfilData(): AclProfilData {
  const pa = useGristPa();
  const [state, setState] = useState<Omit<AclProfilData, "refresh">>(INITIAL_WITHOUT_REFRESH);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    const trust = getEmbedTrust();
    if (trust === "standalone" || trust === "untrusted") {
      setState({
        status: "standalone",
        role: null,
        email: null,
        equipeLabel: null,
        flags: PAGE_ACCESS_ALL_OPEN,
        error: null,
      });
      return;
    }

    if (pa.untrustedEmbed) {
      setState({
        status: "error",
        role: null,
        email: null,
        equipeLabel: null,
        flags: PAGE_ACCESS_FAIL_CLOSED,
        error: "Embed non autorisé : profil d’accès indisponible.",
      });
      return;
    }

    if (pa.outsideGrist) {
      setState({
        status: "standalone",
        role: null,
        email: null,
        equipeLabel: null,
        flags: PAGE_ACCESS_ALL_OPEN,
        error: null,
      });
      return;
    }

    if (pa.loading) {
      setState((prev) =>
        prev.status === "loading" ? prev : { ...INITIAL_WITHOUT_REFRESH },
      );
      return;
    }

    let cancelled = false;

    const load = async () => {
      setState((prev) => ({
        ...prev,
        status: prev.status === "ok" ? "ok" : "loading",
        error: null,
      }));
      let lastError: string | null = null;
      let createdOnce = false;

      let sessionEmail: string | null = null;
      try {
        sessionEmail = await resolveGristUserEmail();
      } catch {
        sessionEmail = null;
      }

      for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt += 1) {
        try {
          const raw = await fetchAllowlistedTable("Acl_profil");
          if (cancelled) {
            return;
          }
          const rows = recordsFromFetchTable(raw);
          const row = pickAclProfilRow(rows, sessionEmail);

          if (!row) {
            if (!createdOnce) {
              createdOnce = true;
              try {
                await createOwnAclProfilRecord();
              } catch (createErr) {
                if (cancelled) {
                  return;
                }
                setState({
                  status: "empty",
                  role: null,
                  email: null,
                  equipeLabel: null,
                  flags: PAGE_ACCESS_FAIL_CLOSED,
                  error:
                    createErr instanceof Error
                      ? createErr.message
                      : String(createErr),
                });
                return;
              }
              if (cancelled) {
                return;
              }
              await sleep(FETCH_RETRY_MS);
              continue;
            }
            setState({
              status: "empty",
              role: null,
              email: null,
              equipeLabel: null,
              flags: PAGE_ACCESS_FAIL_CLOSED,
              error: null,
            });
            return;
          }

          const fields: Record<string, unknown> = { ...row };
          delete fields.id;
          const email = emailFromAclProfilFields(fields) ?? sessionEmail;
          const equipeLabel = await resolveEquipeLabelForEmail(email);
          if (cancelled) {
            return;
          }
          setState({
            status: "ok",
            role: roleFromRecord(fields),
            email,
            equipeLabel,
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
        email: null,
        equipeLabel: null,
        flags: PAGE_ACCESS_FAIL_CLOSED,
        error: lastError ?? "Lecture Acl_profil impossible.",
      });
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [pa.loading, pa.outsideGrist, pa.untrustedEmbed, reloadToken]);

  return { ...state, refresh };
}
