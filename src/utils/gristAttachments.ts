/**
 * Ids de pièces jointes référencés par une cellule Attachments.
 * Accepte `["L", id…]`, `[id…]` (déjà décodé), `"[44]"` (SQL/texte), id seul.
 */

/** Taille max d’un fichier mission (aligné app sœur). */
export const MISSION_DOC_MAX_BYTES = 20 * 1024 * 1024;

/** Extensions acceptées pour Docs mission (aligné app sœur). */
export const MISSION_DOC_ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "md",
  "odt",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
] as const;

export function extractGristAttachmentIds(value: unknown): number[] {
  const out = new Set<number>();
  const walk = (v: unknown): void => {
    if (v == null) {
      return;
    }
    if (typeof v === "number" && Number.isFinite(v)) {
      const n = Math.trunc(v);
      if (n !== 0) {
        out.add(n);
      }
      return;
    }
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!trimmed || trimmed === "CENSORED") {
        return;
      }
      const asInt = Number.parseInt(trimmed, 10);
      if (Number.isFinite(asInt) && asInt !== 0 && String(asInt) === trimmed) {
        out.add(asInt);
        return;
      }
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        for (const part of trimmed.slice(1, -1).split(",")) {
          walk(part.trim());
        }
      }
      return;
    }
    if (Array.isArray(v)) {
      if (v[0] === "L") {
        v.slice(1).forEach(walk);
        return;
      }
      v.forEach(walk);
      return;
    }
    // Objet `{ id: n }` parfois renvoyé par certaines APIs
    if (typeof v === "object" && v !== null && "id" in v) {
      walk((v as { id: unknown }).id);
    }
  };
  walk(value);
  return [...out];
}

/** Valeur cellule Attachments Grist à partir d’ids (vide → `null`). */
export function buildGristAttachmentsList(ids: readonly number[]): ["L", ...number[]] | null {
  const unique: number[] = [];
  const seen = new Set<number>();
  for (const raw of ids) {
    if (!Number.isFinite(raw)) {
      continue;
    }
    const id = Math.trunc(raw);
    if (id <= 0 || seen.has(id)) {
      continue;
    }
    seen.add(id);
    unique.push(id);
  }
  if (unique.length === 0) {
    return null;
  }
  return ["L", ...unique];
}

export function formatFileSizeFr(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    const ko = bytes / 1024;
    return `${ko.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ko`;
  }
  const mo = bytes / (1024 * 1024);
  return `${mo.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Mo`;
}

export function fileExtensionLabel(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0 || i === fileName.length - 1) {
    return "Fichier";
  }
  return fileName.slice(i + 1).toUpperCase();
}

export function fileExtensionLower(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0 || i === fileName.length - 1) {
    return "";
  }
  return fileName.slice(i + 1).toLowerCase();
}

/** Valide type / taille avant upload Docs mission. */
export function validateMissionDocFile(file: File): string | null {
  if (file.size <= 0) {
    return "Le fichier est vide.";
  }
  if (file.size > MISSION_DOC_MAX_BYTES) {
    return "Fichier trop volumineux (20 Mo max. par fichier).";
  }
  const ext = fileExtensionLower(file.name);
  if (
    !ext ||
    !(MISSION_DOC_ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
  ) {
    return "Type de fichier non accepté (PDF, Word, Excel, PowerPoint, Markdown, ODT ou image).";
  }
  return null;
}

export const MISSION_DOC_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.md,.odt,.png,.jpg,.jpeg,.gif,.webp";

export const MISSION_DOC_HINT =
  "PDF, Word, Excel, PowerPoint, Markdown, ODT ou image — 20 Mo max. par fichier. Les nouveaux fichiers s’ajoutent aux pièces existantes.";

/** Ids renvoyés par `POST /attachments` (nombres ou strings). */
export function parseUploadedAttachmentIds(payload: unknown): number[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const ids: number[] = [];
  for (const item of payload) {
    if (typeof item === "number" && Number.isFinite(item) && item > 0) {
      ids.push(Math.trunc(item));
      continue;
    }
    if (typeof item === "string") {
      const n = Number.parseInt(item, 10);
      if (Number.isFinite(n) && n > 0) {
        ids.push(n);
      }
    }
  }
  return ids;
}

/** Fusionne ids existants + nouveaux sans doublon (ordre : existants puis nouveaux). */
export function mergeAttachmentIds(
  existing: readonly number[],
  added: readonly number[],
): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const id of [...existing, ...added]) {
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  return out;
}
