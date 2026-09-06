/**
 * Confiance d’embed : l’URL Pages est publique, mais les données Grist
 * ne transitent que via postMessage parent ↔ widget (session utilisateur).
 * On refuse d’activer l’API si l’iframe n’est pas sous un parent Grist connu.
 */

const ALLOWED_PARENT_ORIGINS = [
  "https://grist.numerique.gouv.fr",
] as const;

function isAllowedGristOrigin(origin: string): boolean {
  if ((ALLOWED_PARENT_ORIGINS as readonly string[]).includes(origin)) {
    return true;
  }
  // Autres instances Grist gouv / labs éventuelles
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") {
      return false;
    }
    return (
      url.hostname === "grist.numerique.gouv.fr" ||
      url.hostname.endsWith(".grist.numerique.gouv.fr") ||
      url.hostname === "docs.getgrist.com" ||
      url.hostname.endsWith(".getgrist.com")
    );
  } catch {
    return false;
  }
}

export type EmbedTrust = "standalone" | "trusted" | "untrusted";

/**
 * - standalone : ouvert hors iframe (dev / visite directe URL Pages) → pas de données
 * - trusted : parent Grist autorisé (ou API plugin présente en iframe)
 * - untrusted : iframe sous un site tiers → ne pas appeler grist.ready
 */
export function getEmbedTrust(): EmbedTrust {
  if (typeof window === "undefined") {
    return "standalone";
  }
  if (window.parent === window) {
    return "standalone";
  }

  const ancestorOrigins = (
    window.location as Location & { ancestorOrigins?: DOMStringList }
  ).ancestorOrigins;
  if (ancestorOrigins && ancestorOrigins.length > 0) {
    const parentOrigin = ancestorOrigins[0];
    return isAllowedGristOrigin(parentOrigin) ? "trusted" : "untrusted";
  }

  if (document.referrer) {
    try {
      const refOrigin = new URL(document.referrer).origin;
      if (isAllowedGristOrigin(refOrigin)) {
        return "trusted";
      }
      // Referrer d’un site tiers alors qu’on est en iframe
      if (!window.grist) {
        return "untrusted";
      }
    } catch {
      /* ignore */
    }
  }

  // Canal plugin Grist injecté par le parent légitime
  if (window.grist?.ready) {
    return "trusted";
  }

  return "untrusted";
}
