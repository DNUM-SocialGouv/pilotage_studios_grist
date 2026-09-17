import type { Intervenant, MissionEnfant, SuiviMensuel } from "../types.ts";
import { copyHtmlToClipboard, copyTextToClipboard } from "./clipboard.ts";
import { formatMontantEur } from "./formatMontant.ts";
import {
  extractGristReferenceId,
  extractProduitLibelleFromSuivi,
  extractProduitRefFromSuivi,
  extractSuiviBdcRowRef,
} from "./gristReferences.ts";
import {
  formatGristPeriodeMoisAnnee,
  gristPeriodeFilterKey,
} from "./gristPeriode.ts";
import { resolveSuiviMasterMissionId } from "./missionEnfants.ts";
import { libelleProduitGrist } from "./pilotageProduits.ts";
import { montantTtcSuiviMensuel } from "./suiviMensuel.ts";

export { copyHtmlToClipboard, copyTextToClipboard } from "./clipboard.ts";

export const CRA_EXPORT_SANS_PORTAGE = "Sans portage";

export type CraExportRow = {
  portage: string;
  intervenant: string;
  periode: string;
  periodeKey: string;
  /** Libellé métier (`Nom_BdC`). */
  bdc: string;
  /** N° Chorus (`BdC_Chorus`), « — » si absent. */
  bdcChorus: string;
  jours: number | null;
  ttc: number | null;
  produit: string;
  mission: string;
  equipe: string;
};

export type CraExportPortageGroup = {
  portage: string;
  rows: CraExportRow[];
  totalJours: number;
  totalTtc: number;
};

export type CraExportLabelMaps = {
  intervenantsById: Map<number, string>;
  portageByIntervenantId: Map<number, string>;
  bdcById: Map<number, string>;
  bdcChorusById: Map<number, string>;
  produitsById: Map<number, string>;
  missionsById: Map<number, string>;
  enfantsById: Map<number, MissionEnfant>;
};

/** Colonnes exportables (aperçu + CSV + copie). */
export type CraExportColumnId =
  | "portage"
  | "intervenant"
  | "periode"
  | "bdcChorus"
  | "bdc"
  | "jours"
  | "ttc"
  | "produit"
  | "mission"
  | "equipe";

export type CraExportColumnDef = {
  id: CraExportColumnId;
  label: string;
  /** Alignement numérique dans le tableau d’aperçu. */
  numeric?: boolean;
  /** Utile surtout en interne (mission / produit) — désactivé par défaut pour l’envoi porteur. */
  internalByDefault?: boolean;
};

export const CRA_EXPORT_COLUMNS: readonly CraExportColumnDef[] = [
  { id: "portage", label: "Portage" },
  { id: "intervenant", label: "Intervenant" },
  { id: "periode", label: "Période", internalByDefault: true },
  { id: "bdcChorus", label: "N° Chorus" },
  { id: "bdc", label: "Bon de commande" },
  { id: "jours", label: "Jours", numeric: true },
  { id: "ttc", label: "TTC", numeric: true },
  { id: "produit", label: "Produit", internalByDefault: true },
  { id: "mission", label: "Mission", internalByDefault: true },
  { id: "equipe", label: "Équipe", internalByDefault: true },
] as const;

/** Colonnes activées par défaut (envoi porteur : sans produit / mission / équipe / période). */
export function defaultCraExportColumnVisibility(): Record<CraExportColumnId, boolean> {
  const out = {} as Record<CraExportColumnId, boolean>;
  for (const col of CRA_EXPORT_COLUMNS) {
    out[col.id] = !col.internalByDefault;
  }
  return out;
}

export function selectedCraExportColumns(
  visibility: Partial<Record<CraExportColumnId, boolean>>,
): CraExportColumnDef[] {
  return CRA_EXPORT_COLUMNS.filter((col) => visibility[col.id] !== false);
}

export function buildPortageByIntervenantId(
  intervenants: readonly Intervenant[],
): Map<number, string> {
  const map = new Map<number, string>();
  for (const i of intervenants) {
    const portage = i.Portage?.trim();
    map.set(i.id, portage || CRA_EXPORT_SANS_PORTAGE);
  }
  return map;
}

function intervenantRefId(s: SuiviMensuel): number | undefined {
  const id = extractGristReferenceId(s.Intervenants);
  return id != null && id !== 0 ? id : undefined;
}

function labelIntervenant(s: SuiviMensuel, maps: CraExportLabelMaps): string {
  const id = intervenantRefId(s);
  if (id === undefined) {
    return "—";
  }
  return maps.intervenantsById.get(id) ?? `#${id}`;
}

function portageForSuivi(s: SuiviMensuel, maps: CraExportLabelMaps): string {
  const id = intervenantRefId(s);
  if (id === undefined) {
    return CRA_EXPORT_SANS_PORTAGE;
  }
  return maps.portageByIntervenantId.get(id) ?? CRA_EXPORT_SANS_PORTAGE;
}

function bdcRefForSuivi(s: SuiviMensuel): number | undefined {
  const ref = extractSuiviBdcRowRef(s as SuiviMensuel & Record<string, unknown>);
  return ref !== undefined && ref !== 0 ? ref : undefined;
}

function labelBdc(s: SuiviMensuel, maps: CraExportLabelMaps): string {
  const ref = bdcRefForSuivi(s);
  if (ref !== undefined) {
    return maps.bdcById.get(ref) ?? `BDC #${ref}`;
  }
  return s.Nom_BdC?.trim() || "—";
}

function labelBdcChorus(s: SuiviMensuel, maps: CraExportLabelMaps): string {
  const ref = bdcRefForSuivi(s);
  if (ref !== undefined) {
    return maps.bdcChorusById.get(ref)?.trim() || "—";
  }
  return "—";
}

function labelProduit(s: SuiviMensuel, maps: CraExportLabelMaps): string {
  const direct = extractProduitLibelleFromSuivi(s as unknown as Record<string, unknown>);
  if (direct) {
    return direct;
  }
  const pid = extractProduitRefFromSuivi(s as unknown as Record<string, unknown>);
  if (pid === undefined) {
    return "—";
  }
  return maps.produitsById.get(pid) ?? libelleProduitGrist({}, pid);
}

function labelMission(s: SuiviMensuel, maps: CraExportLabelMaps): string {
  const mid = resolveSuiviMasterMissionId(s, maps.enfantsById);
  if (mid === undefined) {
    return "—";
  }
  return maps.missionsById.get(mid) ?? `Mission #${mid}`;
}

export function buildCraExportRows(
  rows: readonly SuiviMensuel[],
  maps: CraExportLabelMaps,
): CraExportRow[] {
  return rows.map((s) => {
    const periodeKey = gristPeriodeFilterKey(s.Periode, s) ?? "";
    const jours =
      typeof s.Nb_jours === "number" && Number.isFinite(s.Nb_jours) ? s.Nb_jours : null;
    const ttc = montantTtcSuiviMensuel(s);
    return {
      portage: portageForSuivi(s, maps),
      intervenant: labelIntervenant(s, maps),
      periode: formatGristPeriodeMoisAnnee(s.Periode, s),
      periodeKey,
      bdc: labelBdc(s, maps),
      bdcChorus: labelBdcChorus(s, maps),
      jours,
      ttc: ttc ?? null,
      produit: labelProduit(s, maps),
      mission: labelMission(s, maps),
      equipe: s.Equipe?.trim() || "—",
    };
  });
}

export function groupCraExportByPortage(rows: readonly CraExportRow[]): CraExportPortageGroup[] {
  const byPortage = new Map<string, CraExportRow[]>();
  for (const row of rows) {
    const list = byPortage.get(row.portage);
    if (list) {
      list.push(row);
    } else {
      byPortage.set(row.portage, [row]);
    }
  }

  return Array.from(byPortage.entries())
    .map(([portage, groupRows]) => {
      let totalJours = 0;
      let totalTtc = 0;
      for (const r of groupRows) {
        if (r.jours != null) {
          totalJours += r.jours;
        }
        if (r.ttc != null) {
          totalTtc += r.ttc;
        }
      }
      const sorted = groupRows.slice().sort((a, b) => {
        const byIntervenant = a.intervenant.localeCompare(b.intervenant, "fr", {
          sensitivity: "base",
        });
        if (byIntervenant !== 0) {
          return byIntervenant;
        }
        return a.bdc.localeCompare(b.bdc, "fr", { sensitivity: "base" });
      });
      return { portage, rows: sorted, totalJours, totalTtc };
    })
    .sort((a, b) => {
      if (a.portage === CRA_EXPORT_SANS_PORTAGE) {
        return 1;
      }
      if (b.portage === CRA_EXPORT_SANS_PORTAGE) {
        return -1;
      }
      return a.portage.localeCompare(b.portage, "fr", { sensitivity: "base" });
    });
}

function csvEscape(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatJoursCsv(value: number | null): string {
  if (value == null) {
    return "";
  }
  return String(value).replace(".", ",");
}

function formatTtcCsv(value: number | null): string {
  if (value == null) {
    return "";
  }
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTtcDisplay(value: number | null): string {
  return formatMontantEur(value);
}

function cellValueForColumn(
  row: CraExportRow,
  columnId: CraExportColumnId,
  mode: "csv" | "clipboard" | "display",
): string {
  switch (columnId) {
    case "portage":
      return row.portage;
    case "intervenant":
      return row.intervenant;
    case "periode":
      return row.periode;
    case "bdcChorus":
      return mode === "display" ? row.bdcChorus : row.bdcChorus === "—" ? "" : row.bdcChorus;
    case "bdc":
      return row.bdc;
    case "jours":
      if (row.jours == null) {
        return mode === "display" ? "—" : "";
      }
      return mode === "csv" ? formatJoursCsv(row.jours) : String(row.jours);
    case "ttc":
      if (mode === "csv") {
        return formatTtcCsv(row.ttc);
      }
      if (mode === "clipboard") {
        return row.ttc == null ? "" : formatMontantEur(row.ttc);
      }
      return formatTtcDisplay(row.ttc);
    case "produit":
      return row.produit;
    case "mission":
      return row.mission;
    case "equipe":
      return row.equipe;
    default: {
      const _exhaustive: never = columnId;
      return _exhaustive;
    }
  }
}

export function craExportRowsToCsv(
  rows: readonly CraExportRow[],
  columns: readonly CraExportColumnDef[] = CRA_EXPORT_COLUMNS,
): string {
  const active = columns.length > 0 ? columns : CRA_EXPORT_COLUMNS;
  const lines = [active.map((c) => c.label).join(";")];
  for (const row of rows) {
    lines.push(
      active.map((c) => csvEscape(cellValueForColumn(row, c.id, "csv"))).join(";"),
    );
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** Tableau Markdown pour coller (Notion / Slack / GitHub…). */
export function craExportRowsToMarkdown(
  rows: readonly CraExportRow[],
  columns: readonly CraExportColumnDef[] = CRA_EXPORT_COLUMNS,
): string {
  const active = columns.length > 0 ? columns : CRA_EXPORT_COLUMNS;
  const escapeMd = (value: string) =>
    value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();

  const header = `| ${active.map((c) => escapeMd(c.label)).join(" | ")} |`;
  const sep = `| ${active.map(() => "---").join(" | ")} |`;
  const body = rows.map(
    (row) =>
      `| ${active
        .map((c) => escapeMd(cellValueForColumn(row, c.id, "clipboard")))
        .join(" | ")} |`,
  );
  return [header, sep, ...body].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Tableau HTML pour coller dans un mail (Outlook, etc.). */
export function craExportRowsToHtml(
  rows: readonly CraExportRow[],
  columns: readonly CraExportColumnDef[] = CRA_EXPORT_COLUMNS,
): string {
  const active = columns.length > 0 ? columns : CRA_EXPORT_COLUMNS;
  const ths = active
    .map((c) => {
      const align = c.numeric ? ' style="text-align:right"' : "";
      return `<th${align}>${escapeHtml(c.label)}</th>`;
    })
    .join("");
  const trs = rows
    .map((row) => {
      const tds = active
        .map((c) => {
          const align = c.numeric ? ' style="text-align:right"' : "";
          return `<td${align}>${escapeHtml(cellValueForColumn(row, c.id, "clipboard"))}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");
  return (
    `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px">` +
    `<thead><tr>${ths}</tr></thead>` +
    `<tbody>${trs}</tbody>` +
    `</table>`
  );
}

export type CraExportCopyFormat = "md" | "html";

export async function copyCraExportTable(
  rows: readonly CraExportRow[],
  columns: readonly CraExportColumnDef[],
  format: CraExportCopyFormat,
): Promise<void> {
  const markdown = craExportRowsToMarkdown(rows, columns);
  if (format === "md") {
    await copyTextToClipboard(markdown);
    return;
  }
  const html = craExportRowsToHtml(rows, columns);
  await copyHtmlToClipboard(html, markdown);
}

export function craExportCellDisplay(
  row: CraExportRow,
  columnId: CraExportColumnId,
): string {
  const raw = cellValueForColumn(row, columnId, "display");
  if (columnId === "jours" && row.jours != null) {
    return row.jours.toLocaleString("fr-FR");
  }
  return raw;
}

export function sanitizeCraExportFilenamePart(value: string): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "export";
}

export function craExportCsvFilename(periodeLabel: string, portage?: string): string {
  const periodePart = sanitizeCraExportFilenamePart(periodeLabel || "periode");
  if (portage) {
    return `cra-${periodePart}-${sanitizeCraExportFilenamePart(portage)}.csv`;
  }
  return `cra-${periodePart}-tous-porteurs.csv`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function downloadCraExportCsv(
  filename: string,
  rows: readonly CraExportRow[],
  columns?: readonly CraExportColumnDef[],
): void {
  downloadTextFile(filename, craExportRowsToCsv(rows, columns), "text/csv;charset=utf-8");
}

/** Télécharge un CSV par porteur (délai court pour éviter le blocage navigateur). */
export async function downloadCraExportCsvByPortage(
  groups: readonly CraExportPortageGroup[],
  periodeLabel: string,
  columns?: readonly CraExportColumnDef[],
): Promise<void> {
  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i];
    downloadCraExportCsv(craExportCsvFilename(periodeLabel, group.portage), group.rows, columns);
    if (i < groups.length - 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 250);
      });
    }
  }
}
