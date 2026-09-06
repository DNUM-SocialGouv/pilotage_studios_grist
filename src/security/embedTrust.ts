/**
 * Confiance d’embed : l’URL Pages est publique, mais les données Grist
 * ne transitent que via postMessage parent ↔ widget (session utilisateur).
 */

const ALLOWED_PARENT_ORIGINS = [
  "https://grist.numerique.gouv.fr",
] as const;

function isAllowedGristOrigin(origin: string): boolean {
  if ((ALLOWED_PARENT_ORIGINS as readonly string[]).includes(origin)) {
    return true;
  }
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") {
      return false;
    }
    return (
      url.hostname === "grist.numerique.gouv.fr" ||
      url.hostname.endsWith(".grist.numerique.gouv.fr")
    );
  } catch {
    return false;
  }
}

export type EmbedTrust = "standalone" | "trusted" | "untrusted";

/**
 * - standalone : hors iframe
 * - trusted : parent Grist connu, ou API plugin déjà présente
 * - untrusted : iframe sous un site tiers sans API Grist
 */
export function getEmbedTrust(): EmbedTrust {
  if (typeof window === "undefined") {
    return "standalone";
  }
  if (window.parent === window) {
    return "standalone";
  }

  // Si l’API plugin est là, le parent Grist a bien chargé le widget
  if (window.grist?.ready) {
    return "trusted";
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
      return "untrusted";
    } catch {
      /* ignore */
    }
  }

  // Iframe sans indices : laisser tenter grist.ready (évite faux négatif Firefox)
  return "trusted";
}
