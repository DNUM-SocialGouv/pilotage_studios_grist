/** Types et helpers partagés — grilles tarifaires UO par porteur (BPU 2MAINS Lot 4). */

import { formatMontantEur } from "../utils/formatMontant.ts";

export { formatMontantEur };

export type UoTarifEntry = {
  /** Code tel que dans le BPU Excel. */
  code: string;
  label: string;
  kind: "forfait" | "packaged";
  prixHt: number;
  prixTtc: number;
};

export type UoTarifGrilleMeta = {
  porteurId: string;
  labelCourt: string;
  source: string;
  /**
   * Indexation BPU (ex. 1,007) déjà intégrée dans les PU HT Excel.
   * Ce n’est **pas** le markup porteur (ex. Inops 1,05263).
   */
  actualisation: number;
  /** Markup porteur HT → avant TVA (ex. Inops × 1,05263). */
  markup?: number;
  /** TVA (ex. × 1,20). */
  tva?: number;
  /** Coefficient TTC = markup × TVA (ex. Inops × 1,263156). */
  coefficientTtc?: number;
};

/** Normalise un code UO (espaces / tirets) pour comparaison. */
export function normalizeUoCodeKey(code: string): string {
  return code
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/p\s*-\s*/g, "p-")
    .replace(/f\s*-\s*/g, "f-");
}

export function indexUoTarifsByKey(
  tarifs: readonly UoTarifEntry[],
): Map<string, UoTarifEntry> {
  return new Map(tarifs.map((t) => [normalizeUoCodeKey(t.code), t]));
}

export function formatEuro(n: number): string {
  return formatMontantEur(n);
}

export type UoQuantiteLigne = {
  code: string;
  quantite: number;
};

export type UoChiffrageLigne = {
  code: string;
  label: string;
  quantite: number;
  prixUnitaireHt: number;
  prixUnitaireTtc: number;
  totalHt: number;
  totalTtc: number;
};

export function computeChiffrageLignes(
  findTarif: (code: string) => UoTarifEntry | undefined,
  lignes: readonly UoQuantiteLigne[],
): { lignes: UoChiffrageLigne[]; totalHt: number; totalTtc: number } {
  const out: UoChiffrageLigne[] = [];
  let totalHt = 0;
  let totalTtc = 0;
  for (const { code, quantite } of lignes) {
    const t = findTarif(code);
    if (!t) {
      continue;
    }
    const q = Number.isFinite(quantite) && quantite > 0 ? quantite : 0;
    const lineHt = Math.round(t.prixHt * q * 100) / 100;
    const lineTtc = Math.round(t.prixTtc * q * 100) / 100;
    totalHt += lineHt;
    totalTtc += lineTtc;
    out.push({
      code: t.code,
      label: t.label,
      quantite: q,
      prixUnitaireHt: t.prixHt,
      prixUnitaireTtc: t.prixTtc,
      totalHt: lineHt,
      totalTtc: lineTtc,
    });
  }
  return {
    lignes: out,
    totalHt: Math.round(totalHt * 100) / 100,
    totalTtc: Math.round(totalTtc * 100) / 100,
  };
}

/**
 * Chiffrage multi-lignes pour l'export devis — tableau Markdown
 * (converti en `<table>` HTML par `multilineToHtml`).
 */
export function formatChiffrageQuantites(
  findTarif: (code: string) => UoTarifEntry | undefined,
  lignes: readonly UoQuantiteLigne[],
  meta: Pick<UoTarifGrilleMeta, "labelCourt">,
): string {
  if (lignes.length === 0) {
    return "À défaut, le chiffrage sera basé sur un temps plein sur la période couverte par le devis.";
  }
  const { lignes: calc, totalHt, totalTtc } = computeChiffrageLignes(findTarif, lignes);
  if (calc.length === 0) {
    return "Tarifs BPU introuvables pour les UO sélectionnées.";
  }

  const hasQty = calc.some((l) => l.quantite > 0);
  const cell = (value: string) => value.replace(/\|/g, "/").trim();

  const lines: string[] = [
    `Référentiel : BPU ${meta.labelCourt}`,
    "",
    "| Code | Libellé | Qté | PU HT | Montant HT | Montant TTC |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
  ];

  for (const l of calc) {
    const label = cell(l.label.replace(/^UO\s+/i, "").trim() || l.label);
    const qte = l.quantite > 0 ? String(l.quantite) : "—";
    const mtHt = l.quantite > 0 ? formatEuro(l.totalHt) : "—";
    const mtTtc = l.quantite > 0 ? formatEuro(l.totalTtc) : "—";
    lines.push(
      `| ${cell(l.code)} | ${label} | ${qte} | ${formatEuro(l.prixUnitaireHt)} | ${mtHt} | ${mtTtc} |`,
    );
  }

  lines.push("");

  if (hasQty) {
    lines.push(
      `**Total devis :** ${formatEuro(totalHt)} HT · ${formatEuro(totalTtc)} TTC`,
    );
  } else {
    lines.push(
      "Renseigner le nombre d'UO (jours) pour chaque ligne ; à défaut, chiffrage temps plein sur la période.",
    );
  }

  return lines.join("\n").trimEnd();
}
