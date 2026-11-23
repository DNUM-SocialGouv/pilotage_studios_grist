/**
 * Formulaire édition cadre BDC (Admin / Owner) — valeurs UI + mapping champs Grist.
 * Colonnes écrites uniquement (pas Devis, totaux calculés, Intervenants).
 */

import type { BDC, PlanActivite } from "../types.ts";
import {
  extractGristReferenceId,
  extractGristStringTokens,
} from "./gristReferences.ts";
import { PORTAGE_PORTEUR_MALT } from "./portageProjet.ts";

/** Statuts métier connus sur `BDC.Statut`. */
export const BDC_STATUT_CHOICES = [
  "A venir",
  "En cours",
  "Soldé",
  "Annulé",
] as const;

/** Plateformes connues (complétées par les valeurs déjà en base). */
export const BDC_PLATEFORME_CHOICES = ["Malt", "Sofiane"] as const;

/** Équipes / studios connus (complétés par les tokens déjà en base). */
export const BDC_EQUIPE_CHOICES = [
  "Design",
  "RU",
  "Product",
  "Access.",
  "Coach",
] as const;

/** Colonnes autorisées côté patch `BDC.update` (allowlist stricte). */
export const BDC_UPDATE_FIELD_KEYS = [
  "Nom_BdC",
  "Statut",
  "Montant_TTC",
  "Financeur",
  "BdC_Chorus",
  "PA",
  "Equipe2",
  "Plateforme",
  "SOFIANE",
] as const;

export type BdcUpdateFieldKey = (typeof BDC_UPDATE_FIELD_KEYS)[number];

export type BdcEditFormValues = {
  Nom_BdC: string;
  Statut: string;
  /** Chaîne formulaire ; parse → nombre ≥ 0. */
  Montant_TTC: string;
  Financeur: string;
  BdC_Chorus: string;
  /** Id PA en chaîne ; vide = pas de rattachement (0). */
  PA: string;
  Equipe2: string[];
  Plateforme: string;
  SOFIANE: string;
};

/** Champs envoyés à `BDC.update` (sous-ensemble allowlisté). */
export type BdcUpdateFields = {
  Nom_BdC: string;
  Statut: string;
  Montant_TTC: number;
  Financeur: string;
  BdC_Chorus: string;
  PA: number;
  Equipe2: string[] | null;
  Plateforme: string;
  SOFIANE: string;
};

function bdcPaRefIdLocal(bdc: Pick<BDC, "PA">): number | undefined {
  const id = extractGristReferenceId(bdc.PA);
  return id != null && id > 0 ? id : undefined;
}

function libellePlanActiviteLocal(pa: PlanActivite): string {
  const desc = pa.Description?.trim();
  const sofianeId = pa.Sofiane_ID;
  if (desc && sofianeId != null) {
    return `${sofianeId} — ${desc}`;
  }
  if (desc) {
    return desc;
  }
  if (sofianeId != null) {
    return `PA ${sofianeId}`;
  }
  return `PA #${pa.id}`;
}

export function emptyBdcEditForm(): BdcEditFormValues {
  return {
    Nom_BdC: "",
    Statut: "En cours",
    Montant_TTC: "",
    Financeur: "",
    BdC_Chorus: "",
    PA: "",
    Equipe2: [],
    Plateforme: "",
    SOFIANE: "",
  };
}

/** Préremplit le formulaire depuis une ligne BDC déjà chargée. */
export function bdcToEditFormValues(bdc: BDC): BdcEditFormValues {
  const paId = bdcPaRefIdLocal(bdc);
  return {
    Nom_BdC: bdc.Nom_BdC?.trim() ?? "",
    Statut: bdc.Statut?.trim() || "En cours",
    Montant_TTC:
      typeof bdc.Montant_TTC === "number" && Number.isFinite(bdc.Montant_TTC)
        ? String(bdc.Montant_TTC)
        : "",
    Financeur: bdc.Financeur?.trim() ?? "",
    BdC_Chorus: bdc.BdC_Chorus?.trim() ?? "",
    PA: paId != null && paId > 0 ? String(paId) : "",
    Equipe2: extractGristStringTokens(bdc.Equipe2),
    Plateforme: bdc.Plateforme?.trim() ?? "",
    SOFIANE: typeof bdc.SOFIANE === "string" ? bdc.SOFIANE.trim() : "",
  };
}

/** Parse montant formulaire : vide → invalid ; sinon nombre ≥ 0. */
export function parseMontantTtc(raw: string): number | "invalid" {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) {
    return "invalid";
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) {
    return "invalid";
  }
  return n;
}

/** ChoiceList Grist : `["L", …tokens]` ou `null` si vide. */
export function buildEquipe2ChoiceList(tokens: string[]): string[] | null {
  const cleaned = [
    ...new Set(
      tokens
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    ),
  ];
  if (cleaned.length === 0) {
    return null;
  }
  return ["L", ...cleaned];
}

export function buildBdcUpdateFields(values: BdcEditFormValues): BdcUpdateFields {
  const montant = parseMontantTtc(values.Montant_TTC);
  if (montant === "invalid") {
    throw new Error("Montant TTC invalide.");
  }

  const paRaw = values.PA.trim();
  let pa = 0;
  if (paRaw) {
    const n = Number.parseInt(paRaw, 10);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error("Plan d’activité invalide.");
    }
    pa = n;
  }

  return {
    Nom_BdC: values.Nom_BdC.trim(),
    Statut: values.Statut.trim(),
    Montant_TTC: montant,
    Financeur: values.Financeur.trim(),
    BdC_Chorus: values.BdC_Chorus.trim(),
    PA: pa,
    Equipe2: buildEquipe2ChoiceList(values.Equipe2),
    Plateforme: values.Plateforme.trim(),
    SOFIANE: values.SOFIANE.trim(),
  };
}

/** Refuse toute clé hors allowlist (défense en profondeur avant `getTable().update`). */
export function sanitizeBdcUpdateFields(
  fields: Record<string, unknown>,
): BdcUpdateFields {
  const allowed = new Set<string>(BDC_UPDATE_FIELD_KEYS);
  for (const key of Object.keys(fields)) {
    if (!allowed.has(key)) {
      throw new Error(`Colonne BDC non autorisée pour mise à jour widget : ${key}`);
    }
  }
  for (const key of BDC_UPDATE_FIELD_KEYS) {
    if (!(key in fields)) {
      throw new Error(`Champ BDC manquant dans le patch : ${key}`);
    }
  }
  return fields as BdcUpdateFields;
}

export function mergeChoiceOptions(base: readonly string[], extras: string[]): string[] {
  const set = new Set<string>();
  for (const v of [...base, ...extras]) {
    const t = v.trim();
    if (t) {
      set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

export function collectBdcFinanceurOptions(bdcList: BDC[]): string[] {
  return mergeChoiceOptions(
    [],
    bdcList.map((b) => b.Financeur?.trim() ?? "").filter(Boolean),
  );
}

export function collectBdcPlateformeOptions(bdcList: BDC[]): string[] {
  return mergeChoiceOptions(
    BDC_PLATEFORME_CHOICES,
    bdcList.map((b) => b.Plateforme?.trim() ?? "").filter(Boolean),
  );
}

export function collectBdcEquipeOptions(bdcList: BDC[]): string[] {
  const extras: string[] = [];
  for (const b of bdcList) {
    extras.push(...extractGristStringTokens(b.Equipe2));
  }
  return mergeChoiceOptions(BDC_EQUIPE_CHOICES, extras);
}

export function collectBdcStatutOptions(current?: string): string[] {
  return mergeChoiceOptions(BDC_STATUT_CHOICES, current ? [current] : []);
}

export type BdcPaSelectOption = { id: number; label: string };

export function buildBdcPaSelectOptions(plans: PlanActivite[]): BdcPaSelectOption[] {
  return plans
    .map((pa) => ({ id: pa.id, label: libellePlanActiviteLocal(pa) }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

/** Colonnes autorisées pour une création courte depuis le panneau Portage. */
export const BDC_CREATE_FROM_PORTAGE_KEYS = [
  "Nom_BdC",
  "Statut",
  "Montant_TTC",
  "BdC_Chorus",
  "Financeur",
  "Plateforme",
] as const;

export type BdcCreateFromPortageKey = (typeof BDC_CREATE_FROM_PORTAGE_KEYS)[number];

export const BDC_CREATE_FROM_PORTAGE_DEFAULT_STATUT = "A venir" satisfies (typeof BDC_STATUT_CHOICES)[number];

export type BdcCreateFromPortageFields = {
  Nom_BdC: string;
  Statut: string;
  Montant_TTC: number;
  BdC_Chorus?: string;
  Financeur?: string;
  Plateforme?: string;
};

export type BdcCreateFromPortageInput = {
  nom: string;
  statut: string;
  montantTtc: string;
  chorus: string;
  financeurPortage: string;
  porteurPortage: string;
};

export type BdcCreateFromPortageErrorField = "nom" | "statut" | "montantTtc";

export type BdcCreateFromPortageResult =
  | { ok: true; fields: BdcCreateFromPortageFields }
  | { ok: false; errors: Partial<Record<BdcCreateFromPortageErrorField, string>> };

const BDC_CREATE_STATUT_SET = new Set<string>(BDC_STATUT_CHOICES);

function optionalTrimmed(value: unknown, label: string): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`${label} invalide.`);
  }
  const text = value.trim();
  return text || undefined;
}

/**
 * Bon de commande court créé avec un portage.
 * Recopie le financeur du portage. Plateforme Malt seulement si le porteur est Malt.
 */
export function buildBdcCreateFromPortage(
  input: BdcCreateFromPortageInput,
): BdcCreateFromPortageResult {
  const errors: Partial<Record<BdcCreateFromPortageErrorField, string>> = {};
  const nom = input.nom.trim();
  if (!nom) {
    errors.nom = "Le nom du bon de commande est obligatoire.";
  }
  const statut = input.statut.trim();
  if (!BDC_CREATE_STATUT_SET.has(statut)) {
    errors.statut = "Choisissez un statut.";
  }
  const montant = parseMontantTtc(input.montantTtc);
  if (montant === "invalid") {
    errors.montantTtc = "Indiquez un montant TTC positif ou zéro.";
  }
  if (!nom || !BDC_CREATE_STATUT_SET.has(statut) || montant === "invalid") {
    return { ok: false, errors };
  }

  const fields: BdcCreateFromPortageFields = {
    Nom_BdC: nom,
    Statut: statut,
    Montant_TTC: montant,
  };
  const chorus = input.chorus.trim();
  if (chorus) {
    fields.BdC_Chorus = chorus;
  }
  const financeur = input.financeurPortage.trim();
  if (financeur) {
    fields.Financeur = financeur;
  }
  if (input.porteurPortage.trim() === PORTAGE_PORTEUR_MALT) {
    fields.Plateforme = PORTAGE_PORTEUR_MALT;
  }
  return { ok: true, fields };
}

/** Refuse toute colonne hors création courte, et les champs obligatoires absents. */
export function sanitizeBdcCreateFromPortageFields(
  fields: Record<string, unknown>,
): BdcCreateFromPortageFields {
  const allowed = new Set<string>(BDC_CREATE_FROM_PORTAGE_KEYS);
  for (const key of Object.keys(fields)) {
    if (!allowed.has(key)) {
      throw new Error(`Colonne BDC non autorisée pour création widget : ${key}`);
    }
  }
  if (typeof fields.Nom_BdC !== "string" || !fields.Nom_BdC.trim()) {
    throw new Error("Le nom du bon de commande est obligatoire.");
  }
  if (typeof fields.Statut !== "string" || !BDC_CREATE_STATUT_SET.has(fields.Statut)) {
    throw new Error("Statut de bon de commande invalide.");
  }
  if (
    typeof fields.Montant_TTC !== "number" ||
    !Number.isFinite(fields.Montant_TTC) ||
    fields.Montant_TTC < 0
  ) {
    throw new Error("Montant TTC invalide.");
  }
  const out: BdcCreateFromPortageFields = {
    Nom_BdC: fields.Nom_BdC.trim(),
    Statut: fields.Statut,
    Montant_TTC: fields.Montant_TTC,
  };
  const chorus = optionalTrimmed(fields.BdC_Chorus, "Numéro Chorus");
  if (chorus) {
    out.BdC_Chorus = chorus;
  }
  const financeur = optionalTrimmed(fields.Financeur, "Financeur");
  if (financeur) {
    out.Financeur = financeur;
  }
  const plateforme = optionalTrimmed(fields.Plateforme, "Plateforme");
  if (plateforme) {
    out.Plateforme = plateforme;
  }
  return out;
}
