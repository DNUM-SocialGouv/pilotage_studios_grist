/** Résolution période Grist (colonne Date UTC = 1er du mois). Port lecture de l’app sœur. */

type ResolvedGristPeriode = { year: number; month: number };

const FRENCH_MONTH_TO_NUMBER: Record<string, number> = {
  janv: 1,
  janvier: 1,
  fevr: 2,
  fevrier: 2,
  mars: 3,
  avr: 4,
  avril: 4,
  mai: 5,
  juin: 6,
  juil: 7,
  juillet: 7,
  aout: 8,
  sept: 9,
  septembre: 9,
  oct: 10,
  octobre: 10,
  nov: 11,
  novembre: 11,
  dec: 12,
  decembre: 12,
};

function normalizeFrenchMonthToken(token: string): string {
  return token
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\.$/, "")
    .trim();
}

function parseGristPeriodeYearToken(y: string): number | null {
  const n = Number.parseInt(y, 10);
  if (!Number.isFinite(n)) {
    return null;
  }
  if (n >= 100) {
    return n;
  }
  return 2000 + n;
}

function resolveGristPeriodeString(value: string): ResolvedGristPeriode | null {
  const t = value.trim();
  if (!t) {
    return null;
  }

  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const year = parseGristPeriodeYearToken(slash[3]!);
    const month = Number.parseInt(slash[2]!, 10);
    if (year != null && month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  const monthYear = t.match(/^([A-Za-zÀ-ÿ.-]+?)[\s./-]+(\d{2,4})$/);
  if (monthYear) {
    const month = FRENCH_MONTH_TO_NUMBER[normalizeFrenchMonthToken(monthYear[1]!)];
    const year = parseGristPeriodeYearToken(monthYear[2]!);
    if (month != null && year != null) {
      return { year, month };
    }
  }

  return null;
}

function resolveGristPeriode(
  periode: unknown,
  row?: { Annee?: string; Mois?: string },
): ResolvedGristPeriode | null {
  if (typeof periode === "number" && Number.isFinite(periode) && periode > 0) {
    const d = new Date(periode * 1000);
    if (!Number.isNaN(d.getTime())) {
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
    }
  }
  if (typeof periode === "string") {
    const fromString = resolveGristPeriodeString(periode);
    if (fromString) {
      return fromString;
    }
  }
  const annee = row?.Annee?.trim();
  const mois = row?.Mois?.trim();
  if (annee && mois) {
    const year = parseGristPeriodeYearToken(annee) ?? Number.parseInt(annee, 10);
    const monthFromName = FRENCH_MONTH_TO_NUMBER[normalizeFrenchMonthToken(mois)];
    const monthFromNumber = Number.parseInt(mois, 10);
    const month =
      monthFromName ??
      (Number.isFinite(monthFromNumber) && monthFromNumber >= 1 && monthFromNumber <= 12
        ? monthFromNumber
        : undefined);
    if (year != null && Number.isFinite(year) && month != null) {
      return { year, month };
    }
    const combined = resolveGristPeriodeString(`${mois} ${annee}`);
    if (combined) {
      return combined;
    }
  }
  return null;
}

/** Clé stable `YYYY-MM` pour tri / filtre sur la colonne `Periode`. */
export function gristPeriodeFilterKey(
  periode: unknown,
  row?: { Annee?: string; Mois?: string },
): string | null {
  const resolved = resolveGristPeriode(periode, row);
  if (!resolved) {
    return null;
  }
  return `${resolved.year}-${String(resolved.month).padStart(2, "0")}`;
}

/** Affichage « Juin 2026 » pour la période de prestation. */
export function formatGristPeriodeMoisAnnee(
  periode: unknown,
  row?: { Annee?: string; Mois?: string },
): string {
  const resolved = resolveGristPeriode(periode, row);
  if (!resolved) {
    return "—";
  }
  const d = new Date(Date.UTC(resolved.year, resolved.month - 1, 1));
  const raw = d.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Timestamp Unix (1er du mois UTC) depuis une clé `YYYY-MM`. */
export function gristPeriodeMonthKeyToTimestamp(key: string): number | undefined {
  const m = key.trim().match(/^(\d{4})-(\d{2})$/);
  if (!m) {
    return undefined;
  }
  const year = Number.parseInt(m[1]!, 10);
  const month = Number.parseInt(m[2]!, 10);
  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return undefined;
  }
  return Math.floor(Date.UTC(year, month - 1, 1) / 1000);
}
