/**
 * Formatage léger des textes narratifs mission (Contexte / notes) :
 * titres `#`–`######`, paragraphes, listes `* / - / •`, gras `**…**`,
 * liens Markdown `[label](https://…)`.
 * Pas de HTML brut ni de Markdown complet.
 */

export type MissionProseInline =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; href: string; label: string };

export type MissionProseHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type MissionProseBlock =
  | { type: "paragraph"; inlines: MissionProseInline[] }
  | { type: "list"; items: MissionProseInline[][] }
  | { type: "heading"; level: MissionProseHeadingLevel; inlines: MissionProseInline[] };

const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const MD_BOLD_RE = /\*\*([^*]+)\*\*/g;
const LIST_ITEM_RE = /^\s*[*•\-]\s+(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.+)$/;

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
  blocks: MissionProseBlock[],
): void {
  if (items.length === 0) {
    return;
  }
  blocks.push({ type: "list", items: [...items] });
  items.length = 0;
}

/**
 * Parse ligne à ligne : titres, listes, paragraphes (soft-wrap entre lignes
 * ordinaires consécutives). Une ligne vide coupe le paragraphe en cours.
 */
export function parseMissionProse(raw: string): MissionProseBlock[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const blocks: MissionProseBlock[] = [];
  const paragraphLines: string[] = [];
  const listItems: MissionProseInline[][] = [];

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushParagraph(paragraphLines, blocks);
      flushList(listItems, blocks);
      continue;
    }

    const heading = parseHeadingLine(trimmed);
    if (heading) {
      flushParagraph(paragraphLines, blocks);
      flushList(listItems, blocks);
      blocks.push({
        type: "heading",
        level: heading.level,
        inlines: parseMissionProseInlines(heading.text),
      });
      continue;
    }

    const listMatch = LIST_ITEM_RE.exec(trimmed);
    if (listMatch) {
      flushParagraph(paragraphLines, blocks);
      listItems.push(parseMissionProseInlines(listMatch[1]!.trim()));
      continue;
    }

    flushList(listItems, blocks);
    paragraphLines.push(trimmed);
  }

  flushParagraph(paragraphLines, blocks);
  flushList(listItems, blocks);
  return blocks;
}
