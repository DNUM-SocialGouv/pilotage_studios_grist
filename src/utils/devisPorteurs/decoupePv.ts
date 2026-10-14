import { formatEuro } from "../../data/uoTarifsShared.ts";

/** Ligne UO prête pour la découpe PV (quantité entière, prix unitaires BPU). */
export type DevisPvUoSource = {
  code: string;
  quantite: number;
  prixUnitaireHt: number;
  prixUnitaireTtc: number;
};

/** Part d’une UO affectée à un PV. */
export type DevisPvUoDetail = {
  code: string;
  quantite: number;
  montantHt: number;
  montantTtc: number;
};

export type DevisPvLigne = {
  /** Index 1-based affiché (« PV 1 »). */
  index: number;
  /** Clé `YYYY-MM`. */
  moisKey: string;
  /** Libellé fr-FR (« Janvier 2026 »). */
  moisLabel: string;
  /** Détail par UO (quantités entières > 0 uniquement). */
  uos: DevisPvUoDetail[];
  /** Somme des quantités UO affectées à ce PV (entière). */
  quantite: number;
  montantHt: number;
  montantTtc: number;
};

export type DevisPvDecoupeResult =
  | { ok: true; lignes: DevisPvLigne[]; totalHt: number; totalTtc: number; totalQuantite: number }
  | { ok: false; reason: string };

/**
 * Répartit un total entier en `parts` parts aussi égales que possible
 * (entiers uniquement — pas de demi-UO). Le reste va sur les derniers PV.
 *
 * Ex. 130 / 4 → [32, 32, 33, 33]
 */
export function splitIntegerEqual(total: number, parts: number): number[] {
  if (!Number.isInteger(parts) || parts <= 0) {
    return [];
  }
  if (!Number.isInteger(total) || total < 0) {
    return [];
  }
  const base = Math.floor(total / parts);
  const rem = total % parts;
  return Array.from({ length: parts }, (_, i) =>
    i >= parts - rem ? base + 1 : base,
  );
}

/** `YYYY-MM-DD` → { year, month } (1–12), ou null. */
function parseIsoDateParts(iso: string): { year: number; month: number } | null {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    return null;
  }
  const year = Number.parseInt(m[1]!, 10);
  const month = Number.parseInt(m[2]!, 10);
  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

function formatMoisLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  const raw = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Nombre de mois calendaires inclus entre deux dates ISO (bornes incluses). */
export function countMonthsInPeriod(debutIso: string, finIso: string): number | null {
  const a = parseIsoDateParts(debutIso);
  const b = parseIsoDateParts(finIso);
  if (!a || !b) {
    return null;
  }
  const n = (b.year - a.year) * 12 + (b.month - a.month) + 1;
  return n > 0 ? n : null;
}

/**
 * Liste de `count` mois consécutifs pour les PV.
 * Départ = mois de début si renseigné, sinon mois de fin − (count−1), sinon mois courant.
 */
export function listMonthsForPv(
  debutIso: string,
  finIso: string,
  count: number,
): { key: string; label: string }[] {
  if (!Number.isInteger(count) || count <= 0) {
    return [];
  }
  const debut = parseIsoDateParts(debutIso);
  const fin = parseIsoDateParts(finIso);
  let year: number;
  let month: number;
  if (debut) {
    year = debut.year;
    month = debut.month;
  } else if (fin) {
    const offset = count - 1;
    const d = new Date(fin.year, fin.month - 1 - offset, 1);
    year = d.getFullYear();
    month = d.getMonth() + 1;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const out: { key: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(year, month - 1 + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    out.push({ key: monthKey(y, m), label: formatMoisLabel(y, m) });
  }
  return out;
}

function isWholeQuantity(n: number): boolean {
  return Number.isFinite(n) && n > 0 && Number.isInteger(n);
}

/**
 * Calcule la découpe PV : quantités entières aussi égales que possible **par UO**,
 * montants HT/TTC = qté × PU, mois dérivés de la période.
 */
export function computeDecoupePv(opts: {
  nbPv: number;
  periodeDebut: string;
  periodeFin: string;
  sources: readonly DevisPvUoSource[];
}): DevisPvDecoupeResult {
  const { nbPv, periodeDebut, periodeFin, sources } = opts;

  if (!Number.isInteger(nbPv) || nbPv < 1) {
    return { ok: false, reason: "Indiquez un nombre de PV entier (≥ 1)." };
  }
  if (nbPv > 36) {
    return { ok: false, reason: "Le nombre de PV est limité à 36." };
  }

  const usable = sources.filter((s) => s.quantite > 0);
  if (usable.length === 0) {
    return {
      ok: false,
      reason: "Saisissez des quantités UO pour calculer la découpe PV.",
    };
  }

  const fractional = usable.find((s) => !isWholeQuantity(s.quantite));
  if (fractional) {
    return {
      ok: false,
      reason:
        "Les quantités UO doivent être entières (pas de demi-UO) pour la découpe PV.",
    };
  }

  const months = listMonthsForPv(periodeDebut, periodeFin, nbPv);
  const uosPerPv: DevisPvUoDetail[][] = Array.from({ length: nbPv }, () => []);

  for (const src of usable) {
    const parts = splitIntegerEqual(src.quantite, nbPv);
    for (let i = 0; i < nbPv; i++) {
      const q = parts[i] ?? 0;
      if (q <= 0) {
        continue;
      }
      uosPerPv[i]!.push({
        code: src.code,
        quantite: q,
        montantHt: Math.round(src.prixUnitaireHt * q * 100) / 100,
        montantTtc: Math.round(src.prixUnitaireTtc * q * 100) / 100,
      });
    }
  }

  const lignes: DevisPvLigne[] = months.map((m, i) => {
    const uos = uosPerPv[i]!;
    const quantite = uos.reduce((s, u) => s + u.quantite, 0);
    const montantHt =
      Math.round(uos.reduce((s, u) => s + u.montantHt, 0) * 100) / 100;
    const montantTtc =
      Math.round(uos.reduce((s, u) => s + u.montantTtc, 0) * 100) / 100;
    return {
      index: i + 1,
      moisKey: m.key,
      moisLabel: m.label,
      uos,
      quantite,
      montantHt,
      montantTtc,
    };
  });

  return {
    ok: true,
    lignes,
    totalQuantite: lignes.reduce((s, l) => s + l.quantite, 0),
    totalHt: Math.round(lignes.reduce((s, l) => s + l.montantHt, 0) * 100) / 100,
    totalTtc: Math.round(lignes.reduce((s, l) => s + l.montantTtc, 0) * 100) / 100,
  };
}

/**
 * Tableau Markdown de découpe PV (sous le chiffrage UO dans l’export).
 * Une ligne par (PV × UO) pour rendre le découpage multi-UO lisible.
 * Chaîne vide si pas de découpe affichable.
 */
export function formatDecoupePvMarkdown(result: DevisPvDecoupeResult): string {
  if (!result.ok || result.lignes.length === 0) {
    return "";
  }

  const multiUo = result.lignes.some((l) => l.uos.length > 1) ||
    new Set(result.lignes.flatMap((l) => l.uos.map((u) => u.code))).size > 1;

  const cell = (value: string) => value.replace(/\|/g, "/").trim();
  const lines: string[] = multiUo
    ? [
        "| PV | Mois | Code | Qté | Montant HT | Montant TTC |",
        "| --- | --- | --- | ---: | ---: | ---: |",
      ]
    : [
        "| PV | Mois | Qté | Montant HT | Montant TTC |",
        "| --- | --- | ---: | ---: | ---: |",
      ];

  for (const l of result.lignes) {
    if (l.uos.length === 0) {
      continue;
    }
    if (!multiUo) {
      const u = l.uos[0]!;
      lines.push(
        `| PV ${l.index} | ${cell(l.moisLabel)} | ${u.quantite} | ${formatEuro(u.montantHt)} | ${formatEuro(u.montantTtc)} |`,
      );
      continue;
    }
    for (const u of l.uos) {
      lines.push(
        `| PV ${l.index} | ${cell(l.moisLabel)} | ${cell(u.code)} | ${u.quantite} | ${formatEuro(u.montantHt)} | ${formatEuro(u.montantTtc)} |`,
      );
    }
  }

  lines.push("");
  lines.push(
    `**Total PV :** ${result.totalQuantite} UO · ${formatEuro(result.totalHt)} HT · ${formatEuro(result.totalTtc)} TTC`,
  );

  return lines.join("\n").trimEnd();
}
