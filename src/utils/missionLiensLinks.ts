/**
 * Extrait des liens affichables depuis `Liens_FIGMA_Notion` :
 * URLs http(s) nues (une par ligne ou séparées) + liens Markdown `[libellé](https://…)`.
 */

export type MissionLienLink = {
  href: string;
  label: string;
};

const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const BARE_URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

function isSafeHttpUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Retire une éventuelle ponctuation finale collée à l’URL (.,;:). */
function trimTrailingPunctuation(href: string): string {
  return href.replace(/[.,;:]+$/u, "");
}

/**
 * Parse le champ liens : d’abord les Markdown, puis les URLs nues restantes.
 * Déduplique par href (ordre de première apparition).
 */
export function parseMissionLiensLinks(raw: string | undefined): MissionLienLink[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  const seen = new Set<string>();
  const out: MissionLienLink[] = [];

  function push(href: string, label: string) {
    const cleaned = trimTrailingPunctuation(href.trim());
    if (!isSafeHttpUrl(cleaned) || seen.has(cleaned)) {
      return;
    }
    seen.add(cleaned);
    out.push({ href: cleaned, label: label.trim() || cleaned });
  }

  MD_LINK_RE.lastIndex = 0;
  let md: RegExpExecArray | null;
  const mdRanges: { start: number; end: number }[] = [];
  while ((md = MD_LINK_RE.exec(raw)) != null) {
    push(md[2]!, md[1]!);
    mdRanges.push({ start: md.index, end: md.index + md[0]!.length });
  }

  function inMdRange(index: number): boolean {
    return mdRanges.some((r) => index >= r.start && index < r.end);
  }

  BARE_URL_RE.lastIndex = 0;
  let bare: RegExpExecArray | null;
  while ((bare = BARE_URL_RE.exec(raw)) != null) {
    if (inMdRange(bare.index)) {
      continue;
    }
    const href = bare[0]!;
    push(href, href);
  }

  return out;
}
