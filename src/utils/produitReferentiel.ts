import type { ProduitSdpc } from "../types.ts";
import { formatGristDate } from "./formatGristDate.ts";
import { safeHttpUrl } from "./produitsList.ts";

/** Thèmes alignés sur la sync app sœur (`PRODUIT_SDPC_SYNC_FIELDS`). */
export type ProduitReferentielTheme =
  | "identite"
  | "securite"
  | "utilisateurs"
  | "cycle";

export type ProduitReferentielFieldKind =
  | "text"
  | "longtext"
  | "url"
  | "urls"
  | "date"
  | "percent"
  | "bool"
  | "tags";

export type ProduitReferentielFieldDef = {
  /** Clé `ProduitSdpc` (colonne cible Grist). */
  key: keyof ProduitSdpc;
  label: string;
  theme: ProduitReferentielTheme;
  kind: ProduitReferentielFieldKind;
};

/**
 * 37 champs du référentiel SDPC (périmètre sync).
 * Libellés métier pour la fiche produit.
 */
export const PRODUIT_REFERENTIEL_FIELDS: readonly ProduitReferentielFieldDef[] = [
  // Identité et gouvernance (11)
  { key: "Produit", label: "Nom du produit", theme: "identite", kind: "text" },
  { key: "Description", label: "Nom complet", theme: "identite", kind: "text" },
  {
    key: "Fonctionnalites_et_contexte",
    label: "Fonctionnalités et contexte",
    theme: "identite",
    kind: "longtext",
  },
  { key: "Statut_actuel", label: "Statut", theme: "identite", kind: "text" },
  { key: "departement_sdpc", label: "Département SDPC", theme: "identite", kind: "text" },
  { key: "D_Metier", label: "Direction métier / portefeuilles", theme: "identite", kind: "tags" },
  { key: "Equipe", label: "Équipe", theme: "identite", kind: "text" },
  { key: "Chef_de_produit", label: "Chef de produit", theme: "identite", kind: "text" },
  { key: "URLs_du_produit", label: "Site / URL du produit", theme: "identite", kind: "url" },
  { key: "Liens_repos_depots", label: "Dépôts", theme: "identite", kind: "urls" },
  {
    key: "Actions_de_la_feuille_de_route",
    label: "Feuille de route",
    theme: "identite",
    kind: "longtext",
  },

  // Sécurité et conformité (10)
  {
    key: "Statut_d_homologation_de_securite",
    label: "Statut d’homologation",
    theme: "securite",
    kind: "text",
  },
  {
    key: "Debut_validite_homologation",
    label: "Début de validité d’homologation",
    theme: "securite",
    kind: "date",
  },
  {
    key: "Fin_de_validite_d_homologation",
    label: "Fin de validité d’homologation",
    theme: "securite",
    kind: "date",
  },
  {
    key: "Besoin_DICT_Disponibilite",
    label: "DICT — Disponibilité",
    theme: "securite",
    kind: "text",
  },
  {
    key: "Besoin_DICT_Integrite",
    label: "DICT — Intégrité",
    theme: "securite",
    kind: "text",
  },
  {
    key: "Besoin_DICT_Confidentialite",
    label: "DICT — Confidentialité",
    theme: "securite",
    kind: "text",
  },
  {
    key: "Besoin_DICT_Tracabilite",
    label: "DICT — Traçabilité",
    theme: "securite",
    kind: "text",
  },
  {
    key: "SCORE_RGAA_Declaration_reglementaire",
    label: "Déclaration RGAA",
    theme: "securite",
    kind: "text",
  },
  {
    key: "RGAA_Date_declaration",
    label: "Date déclaration RGAA",
    theme: "securite",
    kind: "date",
  },
  {
    key: "RGAA_Tx_conformite",
    label: "Taux de conformité RGAA",
    theme: "securite",
    kind: "percent",
  },

  // Utilisateurs et exploitation (13)
  { key: "Cibles_du_produit", label: "Cibles du produit", theme: "utilisateurs", kind: "tags" },
  {
    key: "Volumetrie_utilisateurs_par_an",
    label: "Volumétrie utilisateurs / an",
    theme: "utilisateurs",
    kind: "text",
  },
  {
    key: "Nature_de_l_application",
    label: "Nature de l’application",
    theme: "utilisateurs",
    kind: "tags",
  },
  { key: "Criticite", label: "Criticité", theme: "utilisateurs", kind: "text" },
  {
    key: "Typologie_d_application",
    label: "Typologie d’application",
    theme: "utilisateurs",
    kind: "tags",
  },
  { key: "Bouton_JDMA", label: "Je Donne Mon Avis (JDMA)", theme: "utilisateurs", kind: "bool" },
  { key: "Lien_stats_JDMA", label: "Lien stats JDMA", theme: "utilisateurs", kind: "url" },
  { key: "Hebergement", label: "Hébergement", theme: "utilisateurs", kind: "tags" },
  { key: "URL_Back_Office", label: "URL back-office", theme: "utilisateurs", kind: "url" },
  { key: "Marche_DEV_TMA", label: "Marché DEV / TMA", theme: "utilisateurs", kind: "text" },
  {
    key: "Prestataire_de_developpement",
    label: "Prestataire de développement",
    theme: "utilisateurs",
    kind: "tags",
  },
  {
    key: "Enjeux_Chiffres_cles",
    label: "Enjeux / chiffres clés",
    theme: "utilisateurs",
    kind: "longtext",
  },
  { key: "Editeur", label: "Éditeur", theme: "utilisateurs", kind: "tags" },

  // Cycle de vie (3)
  {
    key: "Date_de_demande_de_decomissionnement",
    label: "Date de demande de décommissionnement",
    theme: "cycle",
    kind: "date",
  },
  {
    key: "Retrait_de_service",
    label: "Date de retrait de service",
    theme: "cycle",
    kind: "date",
  },
  {
    key: "Projet_strategique",
    label: "Projet stratégique",
    theme: "cycle",
    kind: "tags",
  },
] as const;

export const PRODUIT_REFERENTIEL_THEME_LABELS: Record<ProduitReferentielTheme, string> = {
  identite: "Identité et gouvernance",
  securite: "Sécurité et conformité",
  utilisateurs: "Utilisateurs et exploitation",
  cycle: "Cycle de vie",
};

export type ProduitReferentielDisplayValue =
  | { kind: "empty" }
  | { kind: "text"; text: string }
  | { kind: "longtext"; text: string }
  | { kind: "bool"; value: boolean }
  | { kind: "tags"; tags: string[] }
  | { kind: "link"; href: string; label: string }
  | { kind: "links"; links: { href: string; label: string }[] };

function trimText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const t = value.trim();
    return t || undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function splitTags(raw: string): string[] {
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitUrls(raw: string): string[] {
  const parts = raw.split(/\s+/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const href = safeHttpUrl(p);
    if (href) {
      out.push(href);
    }
  }
  return out;
}

function linkLabelFromHref(href: string): string {
  try {
    const u = new URL(href);
    const path = u.pathname.replace(/\/$/, "");
    if (path && path !== "/") {
      const last = path.split("/").filter(Boolean).pop();
      if (last) {
        return `${u.hostname}/${last}`;
      }
    }
    return u.hostname;
  } catch {
    return href;
  }
}

/** Ratio 0–1 ou pourcentage 0–100 → affichage « 65 % ». */
export function formatReferentielPercent(value: number | undefined): string | undefined {
  if (value == null || !Number.isFinite(value)) {
    return undefined;
  }
  const pct = value >= 0 && value <= 1 ? value * 100 : value;
  const rounded = Math.round(pct * 10) / 10;
  const label =
    Number.isInteger(rounded) || Math.abs(rounded - Math.round(rounded)) < 1e-9
      ? String(Math.round(rounded))
      : String(rounded).replace(".", ",");
  return `${label} %`;
}

export function isReferentielFieldEmpty(
  produit: ProduitSdpc,
  field: ProduitReferentielFieldDef,
): boolean {
  const raw = produit[field.key];
  if (field.kind === "bool") {
    return raw !== true && raw !== false;
  }
  if (field.kind === "date" || field.kind === "percent") {
    return raw == null || (typeof raw === "number" && (!Number.isFinite(raw) || raw === 0));
  }
  if (field.kind === "url" || field.kind === "urls") {
    const t = trimText(raw);
    if (!t) {
      return true;
    }
    if (field.kind === "url") {
      return !safeHttpUrl(t);
    }
    return splitUrls(t).length === 0;
  }
  const t = trimText(raw);
  if (!t) {
    return true;
  }
  // « N/A » compte comme renseigné (choix métier fréquent dans le catalogue).
  return false;
}

export function formatReferentielField(
  produit: ProduitSdpc,
  field: ProduitReferentielFieldDef,
): ProduitReferentielDisplayValue {
  if (isReferentielFieldEmpty(produit, field)) {
    return { kind: "empty" };
  }
  const raw = produit[field.key];

  if (field.kind === "bool") {
    return { kind: "bool", value: raw === true };
  }

  if (field.kind === "date") {
    const n = typeof raw === "number" ? raw : undefined;
    const text = formatGristDate(n);
    if (text === "—") {
      return { kind: "empty" };
    }
    return { kind: "text", text };
  }

  if (field.kind === "percent") {
    const n = typeof raw === "number" ? raw : undefined;
    const text = formatReferentielPercent(n);
    if (!text) {
      return { kind: "empty" };
    }
    return { kind: "text", text };
  }

  const text = trimText(raw) ?? "";

  if (field.kind === "url") {
    const href = safeHttpUrl(text);
    if (!href) {
      return { kind: "empty" };
    }
    return { kind: "link", href, label: linkLabelFromHref(href) };
  }

  if (field.kind === "urls") {
    const hrefs = splitUrls(text);
    if (hrefs.length === 0) {
      return { kind: "empty" };
    }
    return {
      kind: "links",
      links: hrefs.map((href) => ({ href, label: linkLabelFromHref(href) })),
    };
  }

  if (field.kind === "tags") {
    const tags = splitTags(text);
    if (tags.length === 0) {
      return { kind: "empty" };
    }
    return { kind: "tags", tags };
  }

  if (field.kind === "longtext") {
    return { kind: "longtext", text };
  }

  return { kind: "text", text };
}

export type ProduitReferentielCompletion = {
  total: number;
  filled: number;
  empty: number;
  /** 0–100, arrondi. */
  percent: number;
  emptyLabels: string[];
};

export function computeReferentielCompletion(
  produit: ProduitSdpc,
): ProduitReferentielCompletion {
  const total = PRODUIT_REFERENTIEL_FIELDS.length;
  const emptyLabels: string[] = [];
  let filled = 0;
  for (const field of PRODUIT_REFERENTIEL_FIELDS) {
    if (isReferentielFieldEmpty(produit, field)) {
      emptyLabels.push(field.label);
    } else {
      filled += 1;
    }
  }
  const empty = total - filled;
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
  return { total, filled, empty, percent, emptyLabels };
}

export function fieldsForTheme(
  theme: ProduitReferentielTheme,
): ProduitReferentielFieldDef[] {
  return PRODUIT_REFERENTIEL_FIELDS.filter((f) => f.theme === theme);
}

export function themeFilledCount(
  produit: ProduitSdpc,
  theme: ProduitReferentielTheme,
): { filled: number; total: number } {
  const fields = fieldsForTheme(theme);
  let filled = 0;
  for (const f of fields) {
    if (!isReferentielFieldEmpty(produit, f)) {
      filled += 1;
    }
  }
  return { filled, total: fields.length };
}

/** Sous-titre hero : nom complet si distinct du libellé court. */
export function produitNomComplet(produit: ProduitSdpc): string {
  const name = trimText(produit.Produit) ?? "";
  const desc = trimText(produit.Description) ?? "";
  if (desc && desc.toLowerCase() !== name.toLowerCase()) {
    return desc;
  }
  return "";
}
