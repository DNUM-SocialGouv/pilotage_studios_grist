/**
 * Formatage léger des textes narratifs (missions, détail tickets kanban) :
 * titres `#`–`######`, paragraphes, listes `* / - / •` ou `1.`, gras `**…**`,
 * liens Markdown `[label](https://…)`, tableaux GFM `| … |`.
 * Pas de HTML brut ni de Markdown complet.
 */

export type MissionProseInline =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; href: string; label: string };

export type MissionProseHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type MissionProseBlock =
  | { type: "paragraph"; inlines: MissionProseInline[] }
  | { type: "list"; ordered: boolean; items: MissionProseInline[][] }
  | { type: "heading"; level: MissionProseHeadingLevel; inlines: MissionProseInline[] }
  | {
      type: "table";
      headers: MissionProseInline[][];
      rows: MissionProseInline[][][];
    };

const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const MD_BOLD_RE = /\*\*([^*]+)\*\*/g;
const LIST_ITEM_RE = /^\s*[*•\-]\s+(.*)$/;
const ORDERED_LIST_ITEM_RE = /^\s*\d+\.\s+(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const TABLE_SEP_CELL_RE = /^:?-+:?$/;

function isSafeHttpUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parseBoldInlines(text: string): MissionProseInline[] {
  if (!text) {
    return [];
  }
  const out: MissionProseInline[] = [];
  let last = 0;
  MD_BOLD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_BOLD_RE.exec(text)) != null) {
    if (m.index > last) {
      out.push({ type: "text", value: text.slice(last, m.index) });
    }
    out.push({ type: "bold", value: m[1]! });
    last = m.index + m[0]!.length;
  }
  if (last < text.length) {
    out.push({ type: "text", value: text.slice(last) });
  }
  return out.length > 0 ? out : [{ type: "text", value: text }];
}

/** Découpe le texte inline : liens Markdown http(s), puis gras `**…**`. */
export function parseMissionProseInlines(text: string): MissionProseInline[] {
  const out: MissionProseInline[] = [];
  let last = 0;
  MD_LINK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_LINK_RE.exec(text)) != null) {
    const full = m[0]!;
    const label = m[1]!;
    const href = m[2]!;
    if (m.index > last) {
      out.push(...parseBoldInlines(text.slice(last, m.index)));
    }
    if (isSafeHttpUrl(href)) {
      out.push({ type: "link", href, label });
    } else {
      out.push(...parseBoldInlines(full));
    }
    last = m.index + full.length;
  }
  if (last < text.length) {
    out.push(...parseBoldInlines(text.slice(last)));
  }
  return out.length > 0 ? out : [{ type: "text", value: text }];
}

function parseHeadingLine(
  line: string,
): { level: MissionProseHeadingLevel; text: string } | null {
  const m = HEADING_RE.exec(line);
  if (!m) {
    return null;
  }
  const level = m[1]!.length as MissionProseHeadingLevel;
  return { level, text: m[2]!.trim() };
}

/** Cellules d’une ligne `| a | b |` (GFM). */
export function splitMarkdownTableCells(line: string): string[] {
  let t = line.trim();
  if (t.startsWith("|")) {
    t = t.slice(1);
  }
  if (t.endsWith("|")) {
    t = t.slice(0, -1);
  }
  return t.split("|").map((c) => c.trim());
}

export function isMarkdownTableSeparator(line: string): boolean {
  const cells = splitMarkdownTableCells(line);
  return cells.length > 0 && cells.every((c) => TABLE_SEP_CELL_RE.test(c));
}

function looksLikeTableRow(line: string): boolean {
  const t = line.trim();
  if (!t.includes("|")) {
    return false;
  }
  return splitMarkdownTableCells(t).length >= 2;
}

function flushParagraph(
  lines: string[],
  blocks: MissionProseBlock[],
): void {
  if (lines.length === 0) {
    return;
  }
  const text = lines.join(" ");
  blocks.push({
    type: "paragraph",
    inlines: parseMissionProseInlines(text),
  });
  lines.length = 0;
}

function flushList(
  items: MissionProseInline[][],
  ordered: boolean,
  blocks: MissionProseBlock[],
): void {
  if (items.length === 0) {
    return;
  }
  blocks.push({ type: "list", ordered, items: [...items] });
  items.length = 0;
}

type ListBuffer = {
  ordered: boolean;
  items: MissionProseInline[][];
};

/**
 * Parse ligne à ligne : titres, listes, tableaux GFM, paragraphes (soft-wrap
 * entre lignes ordinaires consécutives). Une ligne vide coupe le paragraphe.
 */
export function parseMissionProse(raw: string): MissionProseBlock[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const blocks: MissionProseBlock[] = [];
  const paragraphLines: string[] = [];
  let listBuf: ListBuffer | null = null;

  const flushOpenList = () => {
    if (listBuf) {
      flushList(listBuf.items, listBuf.ordered, blocks);
      listBuf = null;
    }
  };

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i]!;
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushParagraph(paragraphLines, blocks);
      flushOpenList();
      i += 1;
      continue;
    }

    // Tableau GFM : en-tête + séparateur + lignes
    if (
      looksLikeTableRow(trimmed) &&
      i + 1 < lines.length &&
      isMarkdownTableSeparator(lines[i + 1]!.trim())
    ) {
      flushParagraph(paragraphLines, blocks);
      flushOpenList();
      const headers = splitMarkdownTableCells(trimmed).map((c) =>
        parseMissionProseInlines(c),
      );
      i += 2;
      const rows: MissionProseInline[][][] = [];
      while (i < lines.length) {
        const rowLine = lines[i]!.trim();
        if (!looksLikeTableRow(rowLine) || isMarkdownTableSeparator(rowLine)) {
          break;
        }
        rows.push(
          splitMarkdownTableCells(rowLine).map((c) => parseMissionProseInlines(c)),
        );
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const heading = parseHeadingLine(trimmed);
    if (heading) {
      flushParagraph(paragraphLines, blocks);
      flushOpenList();
      blocks.push({
        type: "heading",
        level: heading.level,
        inlines: parseMissionProseInlines(heading.text),
      });
      i += 1;
      continue;
    }

    const unordered = LIST_ITEM_RE.exec(trimmed);
    if (unordered) {
      flushParagraph(paragraphLines, blocks);
      if (listBuf && listBuf.ordered) {
        flushOpenList();
      }
      if (!listBuf) {
        listBuf = { ordered: false, items: [] };
      }
      listBuf.items.push(parseMissionProseInlines(unordered[1]!.trim()));
      i += 1;
      continue;
    }

    const ordered = ORDERED_LIST_ITEM_RE.exec(trimmed);
    if (ordered) {
      flushParagraph(paragraphLines, blocks);
      if (listBuf && !listBuf.ordered) {
        flushOpenList();
      }
      if (!listBuf) {
        listBuf = { ordered: true, items: [] };
      }
      listBuf.items.push(parseMissionProseInlines(ordered[1]!.trim()));
      i += 1;
      continue;
    }

    flushOpenList();
    paragraphLines.push(trimmed);
    i += 1;
  }

  flushParagraph(paragraphLines, blocks);
  flushOpenList();
  return blocks;
}
