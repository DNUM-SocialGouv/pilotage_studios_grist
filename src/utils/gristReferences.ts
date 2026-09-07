/** Liste multi-valeurs Grist : souvent `["L", ...valeurs]`. */
export function parseGristList(value: unknown): string[] {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value) && value[0] === "L") {
    return value.slice(1).map(String);
  }
  if (
    Array.isArray(value) &&
    value[0] === "l" &&
    value.length >= 2 &&
    typeof value[1] === "string"
  ) {
    return [value[1]];
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [String(value)];
}

/** Tokens texte d’une Choice / ChoiceList (équipe, etc.). */
export function extractGristStringTokens(value: unknown): string[] {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return parseGristList(value)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (t.length === 0) {
      return [];
    }
    if (t.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(t);
        if (Array.isArray(parsed)) {
          return parseGristList(parsed)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        }
      } catch {
        /* chaîne non JSON */
      }
    }
    return [t];
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return [String(value)];
  }
  return [];
}

function normalizeGristChoiceString(s: string): string {
  return s.replace(/\u00a0/g, " ").trim();
}

/**
 * Libellé d’une colonne Grist Choice / ChoiceList (string, objet `{choice|label}`, liste `["L", …]`).
 */
export function normalizeGristChoice(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }
  if (typeof value === "string") {
    return normalizeGristChoiceString(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    if (typeof o.choice === "string") {
      return normalizeGristChoiceString(o.choice);
    }
    if (typeof o.label === "string") {
      return normalizeGristChoiceString(o.label);
    }
  }
  const tokens = extractGristStringTokens(value);
  if (tokens.length > 0) {
    return normalizeGristChoiceString(tokens[0]!);
  }
  return normalizeGristChoiceString(String(value));
}

/** Comme `normalizeGristChoice`, mais `undefined` si vide. */
export function asGristChoice(value: unknown): string | undefined {
  const s = normalizeGristChoice(value);
  return s.length > 0 ? s : undefined;
}

/**
 * Extrait l’id de ligne cible d’une valeur « référence » Grist (nombre, chaîne, tuple, etc.).
 */
export function extractGristReferenceId(value: unknown): number | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const n = Number.parseInt(value.trim(), 10);
    return Number.isFinite(n) ? n : undefined;
  }
  if (Array.isArray(value)) {
    if (value[0] === "R" && value.length >= 3 && typeof value[2] === "number") {
      return Math.trunc(value[2]);
    }
    if (value[0] === "L" && value.length >= 2) {
      const tail = value.slice(1);
      if (tail.length === 1) {
        return extractGristReferenceId(tail[0]);
      }
      for (const item of tail) {
        const n = extractGristReferenceId(item);
        if (n !== undefined) {
          return n;
        }
      }
    }
    return extractGristReferenceId(value[0]);
  }
  if (typeof value === "object" && value !== null && "id" in value) {
    return extractGristReferenceId((value as { id: unknown }).id);
  }
  return undefined;
}

const PRODUIT_REF_KEY = "Produit";

/** Id de ligne produit référencé par une ligne `Realise`. */
export function extractProduitRefFromSuivi(record: Record<string, unknown>): number | undefined {
  if (PRODUIT_REF_KEY in record) {
    const id = extractGristReferenceId(record[PRODUIT_REF_KEY]);
    if (id !== undefined && id !== 0) {
      return id;
    }
  }
  return undefined;
}

/** Libellé produit déjà matérialisé sur la ligne suivi (colonnes lookup / formule Grist). */
export function extractProduitLibelleFromSuivi(record: Record<string, unknown>): string | undefined {
  const preferred = [
    "Produit_Libelle",
    "Libelle_Produit",
    "Libelle_du_Produit",
    "Nom_Produit",
    "Nom_du_Produit",
    "Intitule_Produit",
    "Produit_nom",
    "Produit_Nom",
  ];
  for (const k of preferred) {
    const v = record[k];
    if (typeof v === "string") {
      const t = v.trim();
      if (t) {
        return t;
      }
    }
  }
  for (const [k, v] of Object.entries(record)) {
    if (typeof v !== "string") {
      continue;
    }
    const t = v.trim();
    if (!t) {
      continue;
    }
    const kl = k.toLowerCase();
    if (kl.includes("produit") && (kl.includes("nom") || kl.includes("libel") || kl.includes("intitul"))) {
      return t;
    }
  }
  return undefined;
}

const BDC_CIBLE_KEY = "BDC_cible";
const SUIVI_BDC_CHORUS_REF_KEY = "Bdc_Chorus2";

/** La ligne de suivi est rattachée à ce BDC (`BDC_cible` ou `Bdc_Chorus2`). */
export function suiviRowLinksToBdc(record: Record<string, unknown>, bdcId: number): boolean {
  const cible = extractGristReferenceId(record[BDC_CIBLE_KEY]);
  const chorus = extractGristReferenceId(record[SUIVI_BDC_CHORUS_REF_KEY]);
  return (
    (cible !== undefined && cible !== 0 && cible === bdcId) ||
    (chorus !== undefined && chorus !== 0 && chorus === bdcId)
  );
}
