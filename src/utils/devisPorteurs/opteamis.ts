import { uoLot4Label } from "../../data/uoLot4Referentiel.ts";
import { copyHtmlToClipboard, copyTextToClipboard } from "../clipboard.ts";
import type { OpteamisDevisFields } from "./types.ts";

export type DevisCopyFormat = "html" | "md";

/** `YYYY-MM-DD` → `jj/mm/aaaa` pour le texte copié. */
function formatDateInputFr(iso: string): string {
  const v = iso.trim();
  if (!v) {
    return "";
  }
  const [y, m, d] = v.split("-");
  if (!y || !m || !d) {
    return v;
  }
  return `${d}/${m}/${y}`;
}

export function formatPeriodeDevis(debut: string, fin: string): string {
  const a = formatDateInputFr(debut);
  const b = formatDateInputFr(fin);
  if (a && b) {
    return `du ${a} au ${b}`;
  }
  if (a) {
    return `à partir du ${a}`;
  }
  if (b) {
    return `jusqu'au ${b}`;
  }
  return "";
}

export function formatUoConcernees(codes: readonly string[]): string {
  if (codes.length === 0) {
    return "";
  }
  return codes.map((code) => `- ${uoLot4Label(code)}`).join("\n");
}

export function formatEquipesSelection(values: readonly string[]): string {
  return values.map((v) => v.trim()).filter(Boolean).join(", ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Gras Markdown léger `**…**` → HTML (contenu déjà échappé hors marqueurs). */
function inlineMdToHtml(escaped: string): string {
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/**
 * Convertit un bloc texte (paragraphes + listes `-` + tableaux Markdown `|…|`) en HTML Outlook-friendly.
 */
function multilineToHtml(value: string): string {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  type ListItem = { html: string; children: string[] };
  let listItems: ListItem[] = [];
  let paraBuf: string[] = [];
  let tableRows: string[] = [];

  const isTableRow = (raw: string) => {
    const t = raw.trim();
    return t.startsWith("|") && t.endsWith("|") && t.includes("|", 1);
  };

  const isTableSeparator = (raw: string) =>
    /^\|[\s|:.-]+\|$/.test(raw.trim());

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    const lis = listItems
      .map((item) => {
        const nested =
          item.children.length > 0
            ? `<ul style="margin:4px 0 4px 0;padding-left:20px">${item.children
                .map(
                  (c) =>
                    `<li style="margin:2px 0">${inlineMdToHtml(escapeHtml(c))}</li>`,
                )
                .join("")}</ul>`
            : "";
        return `<li style="margin:4px 0">${inlineMdToHtml(escapeHtml(item.html))}${nested}</li>`;
      })
      .join("");
    parts.push(`<ul style="margin:8px 0 12px 0;padding-left:22px">${lis}</ul>`);
    listItems = [];
  };

  const flushParagraph = () => {
    const text = paraBuf.join(" ").trim();
    paraBuf = [];
    if (!text) {
      return;
    }
    parts.push(
      `<p style="margin:0 0 10px 0">${inlineMdToHtml(escapeHtml(text))}</p>`,
    );
  };

  const flushTable = () => {
    if (tableRows.length === 0) {
      return;
    }
    const parseCells = (row: string) =>
      row
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());

    const header = parseCells(tableRows[0]!);
    const bodyStart =
      tableRows.length > 1 && isTableSeparator(tableRows[1]!) ? 2 : 1;
    const body = tableRows.slice(bodyStart).map(parseCells);

    const thStyle =
      "border:1px solid #cfcfcf;padding:6px 8px;text-align:left;background:#f5f5f5;font-weight:bold;vertical-align:top";
    const tdStyle =
      "border:1px solid #cfcfcf;padding:6px 8px;text-align:left;vertical-align:top";
    const tdRight = tdStyle.replace("left", "right");

    const numericCols = new Set(
      header.map((h, i) =>
        /^(qté|qte|pu\s*ht|montant)/i.test(h) ? i : -1,
      ).filter((i) => i >= 0),
    );

    const thead = `<thead><tr>${header
      .map((h, i) => {
        const align = numericCols.has(i) ? thStyle.replace("left", "right") : thStyle;
        return `<th style="${align}">${inlineMdToHtml(escapeHtml(h))}</th>`;
      })
      .join("")}</tr></thead>`;

    const tbody =
      body.length > 0
        ? `<tbody>${body
            .map(
              (cells) =>
                `<tr>${cells
                  .map((c, i) => {
                    const style = numericCols.has(i) ? tdRight : tdStyle;
                    return `<td style="${style}">${inlineMdToHtml(escapeHtml(c))}</td>`;
                  })
                  .join("")}</tr>`,
            )
            .join("")}</tbody>`
        : "";

    parts.push(
      `<table style="border-collapse:collapse;width:100%;font-size:inherit;line-height:1.45;margin:8px 0 12px 0">${thead}${tbody}</table>`,
    );
    tableRows = [];
  };

  for (const raw of lines) {
    if (isTableRow(raw)) {
      flushList();
      flushParagraph();
      tableRows.push(raw);
      continue;
    }
    flushTable();

    const nested = raw.match(/^\s{2,}[-●•]\s+(.*)$/);
    const top = raw.match(/^[-●•]\s+(.*)$/);
    if (nested) {
      flushParagraph();
      if (listItems.length === 0) {
        listItems.push({ html: nested[1], children: [] });
      } else {
        listItems[listItems.length - 1].children.push(nested[1]);
      }
      continue;
    }
    if (top) {
      flushParagraph();
      listItems.push({ html: top[1], children: [] });
      continue;
    }
    if (raw.trim() === "") {
      flushList();
      flushParagraph();
      continue;
    }
    flushList();
    paraBuf.push(raw.trim());
  }
  flushTable();
  flushList();
  flushParagraph();

  return parts.join("") || `<p style="margin:0">—</p>`;
}

function mdLine(label: string, value: string): string {
  const v = value.trim() || "—";
  return `**${label} :** ${v}`;
}

function mdBlock(label: string, value: string): string {
  const v = value.trim();
  if (!v) {
    return `**${label} :** —`;
  }
  return `**${label} :**\n\n${v}`;
}

/** Markdown structuré (Notion / Slack / fallback plain). */
export function formatOpteamisDevisMarkdown(fields: OpteamisDevisFields): string {
  const periode = formatPeriodeDevis(fields.periodeDebut, fields.periodeFin);

  return [
    "## Informations générales",
    "",
    mdLine("Nom du projet", fields.nomProjet),
    mdLine("Financeur", fields.financeur),
    mdLine("Équipe", fields.equipes),
    mdLine("Période couverte par le devis", periode),
    "",
    "---",
    "",
    "## Détails de la prestation",
    "",
    mdBlock("Demande (contexte)", fields.demandeContexte),
    "",
    mdBlock("Liste des livrables attendus", fields.livrablesAttendus),
    "",
    "---",
    "",
    "## Ressources et chiffrage",
    "",
    mdBlock("Unités d'œuvre (UO) concernées", fields.uoConcernees),
    "",
    mdBlock("Informations de chiffrage", fields.informationsChiffrage),
    ...(fields.decoupePv.trim()
      ? ["", mdBlock("Découpe des PV", fields.decoupePv)]
      : []),
  ].join("\n");
}

function htmlField(label: string, value: string): string {
  const v = value.trim() || "—";
  return `<p style="margin:0 0 8px 0"><strong>${escapeHtml(label)} :</strong> ${escapeHtml(v)}</p>`;
}

function htmlBlock(label: string, value: string): string {
  const v = value.trim();
  return (
    `<p style="margin:12px 0 4px 0"><strong>${escapeHtml(label)} :</strong></p>` +
    (v ? multilineToHtml(v) : `<p style="margin:0 0 10px 0">—</p>`)
  );
}

/** HTML riche pour collage Outlook / mail. */
export function formatOpteamisDevisHtml(fields: OpteamisDevisFields): string {
  const periode = formatPeriodeDevis(fields.periodeDebut, fields.periodeFin);
  const h3 =
    'style="margin:18px 0 10px 0;font-size:16px;font-weight:bold;color:#000"';
  const hr =
    '<hr style="border:none;border-top:1px solid #ddd;margin:20px 0" />';

  return (
    `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.45;color:#000">` +
    `<h3 ${h3}>Informations générales</h3>` +
    htmlField("Nom du projet", fields.nomProjet) +
    htmlField("Financeur", fields.financeur) +
    htmlField("Équipe", fields.equipes) +
    htmlField("Période couverte par le devis", periode) +
    hr +
    `<h3 ${h3}>Détails de la prestation</h3>` +
    htmlBlock("Demande (contexte)", fields.demandeContexte) +
    htmlBlock("Liste des livrables attendus", fields.livrablesAttendus) +
    hr +
    `<h3 ${h3}>Ressources et chiffrage</h3>` +
    htmlBlock("Unités d'œuvre (UO) concernées", fields.uoConcernees) +
    htmlBlock("Informations de chiffrage", fields.informationsChiffrage) +
    (fields.decoupePv.trim()
      ? htmlBlock("Découpe des PV", fields.decoupePv)
      : "") +
    `</div>`
  );
}

export async function copyOpteamisDevis(
  fields: OpteamisDevisFields,
  format: DevisCopyFormat,
): Promise<void> {
  const markdown = formatOpteamisDevisMarkdown(fields);
  if (format === "md") {
    await copyTextToClipboard(markdown);
    return;
  }
  const html = formatOpteamisDevisHtml(fields);
  await copyHtmlToClipboard(html, markdown);
}
