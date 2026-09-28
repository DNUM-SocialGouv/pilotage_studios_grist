/**
 * Estimation TTC d’un CRA — lecture indicative (n’écrit pas Calcul_TTC).
 * Aligné sur les montants Grist observés : jours × TJM × markup × TVA.
 */

/** Coefficient plateforme / portage (ex. Malt ~15 %). */
export const CRA_TTC_MARKUP_FACTOR = 1.15;

/** TVA française standard. */
export const CRA_TTC_TVA_FACTOR = 1.2;

/** 1.15 × 1.2 = 1.38 — jours × TJM × ce facteur ≈ Calcul_TTC. */
export const CRA_TTC_COMBINED_FACTOR =
  CRA_TTC_MARKUP_FACTOR * CRA_TTC_TVA_FACTOR;

export type CraTtcEstimate = {
  jours: number;
  tjm: number;
  markupFactor: number;
  tvaFactor: number;
  /** Jours × TJM. */
  htSansMarkup: number;
  /** Jours × TJM × markup. */
  htAvecMarkup: number;
  /** HT avec markup × TVA. */
  ttc: number;
};

/**
 * Décompose le calcul TTC indicatif.
 * Retourne null si jours ou TJM manquants / invalides.
 */
export function estimateCraTtc(
  jours: number,
  tjm: number,
  options?: { markupFactor?: number; tvaFactor?: number },
): CraTtcEstimate | null {
  if (!Number.isFinite(jours) || jours < 0) {
    return null;
  }
  if (!Number.isFinite(tjm) || tjm <= 0) {
    return null;
  }
  const markupFactor = options?.markupFactor ?? CRA_TTC_MARKUP_FACTOR;
  const tvaFactor = options?.tvaFactor ?? CRA_TTC_TVA_FACTOR;
  const htSansMarkup = jours * tjm;
  const htAvecMarkup = htSansMarkup * markupFactor;
  const ttc = htAvecMarkup * tvaFactor;
  return {
    jours,
    tjm,
    markupFactor,
    tvaFactor,
    htSansMarkup,
    htAvecMarkup,
    ttc,
  };
}

/** Libellé % markup pour l’UI (ex. 15 %). */
export function formatMarkupPercent(factor: number = CRA_TTC_MARKUP_FACTOR): string {
  const pct = Math.round((factor - 1) * 1000) / 10;
  return `${pct.toLocaleString("fr-FR")} %`;
}

/** Libellé % TVA (ex. 20 %). */
export function formatTvaPercent(factor: number = CRA_TTC_TVA_FACTOR): string {
  const pct = Math.round((factor - 1) * 1000) / 10;
  return `${pct.toLocaleString("fr-FR")} %`;
}
