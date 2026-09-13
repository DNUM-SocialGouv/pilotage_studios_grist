/**
 * Formatage léger des textes narratifs mission (Contexte / notes) :
 * paragraphes, listes `* / - / •`, gras `**…**`, liens Markdown `[label](https://…)`.
 * Pas de HTML brut ni de Markdown complet.
 */

export type MissionProseInline =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; href: string; label: string };

export type MissionProseBlock =
  | { type: "paragraph"; inlines: MissionProseInline[] }
  | { type: "list"; items: MissionProseInline[][] };

const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const MD_BOLD_RE = /\*\*([^*]+)\*\*/g;
const LIST_ITEM_RE = /^\s*[*•\-]\s+(.*)$/;

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

function isListBlock(block: string): boolean {
  const lines = block.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
  return lines.length > 0 && lines.every((l) => LIST_ITEM_RE.test(l));
}

function parseListItems(block: string): MissionProseInline[][] {
  return block
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      const m = LIST_ITEM_RE.exec(l);
      return parseMissionProseInlines((m?.[1] ?? l).trim());
    });
}

/** Soft-wrap : retours ligne simples → espace (mails collés dans Grist). */
function paragraphText(block: string): string {
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(" ");
}

export function parseMissionProse(raw: string): MissionProseBlock[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }
  const chunks = normalized.split(/\n\s*\n+/);
  const blocks: MissionProseBlock[] = [];
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) {
      continue;
    }
    if (isListBlock(trimmed)) {
      blocks.push({ type: "list", items: parseListItems(trimmed) });
    } else {
      blocks.push({
        type: "paragraph",
        inlines: parseMissionProseInlines(paragraphText(trimmed)),
      });
    }
  }
  return blocks;
}
