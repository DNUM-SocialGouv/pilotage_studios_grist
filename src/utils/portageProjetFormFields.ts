/**
 * Formulaire Admin « Portage » — champs purs, sans appel Grist.
 * Une ligne = un projet chez un porteur, avec une personne, un responsable,
 * et éventuellement un bon de commande.
 */

import type { GristRecord } from "../gristTypes.ts";
import { asGristChoice, extractGristReferenceId } from "./gristReferences.ts";
import {
  dateInputToGristTimestamp,
  gristTimestampToDateInput,
} from "./missionEnfantFormFields.ts";

export const PORTAGE_PROJET_FORM_FIELDS = [
  "Nom_du_projet",
  "Statut",
  "Porteur",
  "Financeur",
  "Equipe",
  "Freelance",
  "Responsable_du_projet",
  "Bon_de_commande",
  "Date_de_debut",
  "Date_de_fin",
] as const;

export type PortageProjetFormField = (typeof PORTAGE_PROJET_FORM_FIELDS)[number];

export type PortageProjetFormValues = Record<PortageProjetFormField, string>;

/** Libellé liste / panneau quand la cellule Grist n’est pas un scalaire lisible. */
export const PORTAGE_VALEUR_A_CORRIGER = "valeur à corriger";

export const PORTAGE_STATUT_SUGGESTIONS = [
  "En cours",
  "Terminé",
  "Annulé",
  "à valider",
] as const;

const TEXT_FIELDS = ["Nom_du_projet", "Statut", "Porteur", "Financeur", "Equipe"] as const;
const REF_FIELDS = ["Freelance", "Responsable_du_projet", "Bon_de_commande"] as const;
const DATE_FIELDS = ["Date_de_debut", "Date_de_fin"] as const;

export type PortageProjetAdminRow = {
  id: number;
  values: PortageProjetFormValues;
  /** Cellules illisibles : non réécrites tant qu’une nouvelle valeur n’est pas choisie. */
  invalid: ReadonlySet<PortageProjetFormField>;
};

export function emptyPortageProjetForm(): PortageProjetFormValues {
  return {
    Nom_du_projet: "",
    Statut: "",
    Porteur: "",
    Financeur: "",
    Equipe: "",
    Freelance: "",
    Responsable_du_projet: "",
    Bon_de_commande: "",
    Date_de_debut: "",
    Date_de_fin: "",
  };
}

function isGristCellError(value: unknown): boolean {
  return Array.isArray(value) && value[0] === "E";
}

function isCensoredToken(value: unknown): boolean {
  return (
    typeof value === "string" &&
    (value === "CENSORED" || value === "..." || value.startsWith("[Pending"))
  );
}

function readTextCell(value: unknown): { text: string; invalid: boolean } {
  if (value == null || value === "") {
    return { text: "", invalid: false };
  }
  if (isGristCellError(value) || isCensoredToken(value)) {
    return { text: "", invalid: true };
  }
  if (typeof value === "string") {
    return { text: value.trim(), invalid: false };
  }
  if (typeof value === "object") {
    const choice = asGristChoice(value);
    if (choice) {
      return { text: choice, invalid: false };
    }
  }
  return { text: "", invalid: true };
}

/** Référence valide : nombre (0 = vide) ou tuple Grist `["R", table, id]`. */
function readRefCell(value: unknown): { id: string; invalid: boolean } {
  if (value == null || value === "" || value === 0) {
    return { id: "", invalid: false };
  }
  if (isGristCellError(value) || isCensoredToken(value)) {
    return { id: "", invalid: true };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return { id: n > 0 ? String(n) : "", invalid: false };
  }
  if (
    Array.isArray(value) &&
    value[0] === "R" &&
    value.length >= 3 &&
    typeof value[2] === "number" &&
    Number.isFinite(value[2])
  ) {
    const n = Math.trunc(value[2]);
    return { id: n > 0 ? String(n) : "", invalid: false };
  }
  return { id: "", invalid: true };
}

function readDateCell(value: unknown): { date: string; invalid: boolean } {
  if (value == null || value === "" || value === 0) {
    return { date: "", invalid: false };
  }
  if (isGristCellError(value) || isCensoredToken(value)) {
    return { date: "", invalid: true };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { date: gristTimestampToDateInput(value), invalid: false };
  }
  return { date: "", invalid: true };
}

export function portageProjetAdminFromRecord(record: GristRecord): PortageProjetAdminRow {
  const values = emptyPortageProjetForm();
  const invalid = new Set<PortageProjetFormField>();

  for (const field of TEXT_FIELDS) {
    const cell = readTextCell(record[field]);
    values[field] = cell.text;
    if (cell.invalid) {
      invalid.add(field);
    }
  }
  for (const field of REF_FIELDS) {
    const cell = readRefCell(record[field]);
    values[field] = cell.id;
    if (cell.invalid) {
      invalid.add(field);
    }
  }
  for (const field of DATE_FIELDS) {
    const cell = readDateCell(record[field]);
    values[field] = cell.date;
    if (cell.invalid) {
      invalid.add(field);
    }
  }

  return { id: record.id, values, invalid };
}

function trimmed(value: string): string {
  return value.trim();
}

const PORTAGE_DATE_ORDER_MESSAGE =
  "La date de fin ne peut pas être antérieure à la date de début.";

/** Les deux dates vides ou une seule remplie : pas de contrainte. Comparaison sur `YYYY-MM-DD`. */
export function portageDateOrderMessage(debut: string, fin: string): string | undefined {
  const start = trimmed(debut);
  const end = trimmed(fin);
  if (!start || !end) {
    return undefined;
  }
  if (end < start) {
    return PORTAGE_DATE_ORDER_MESSAGE;
  }
  return undefined;
}

function assertPortageDateOrder(values: PortageProjetFormValues): void {
  const message = portageDateOrderMessage(values.Date_de_debut, values.Date_de_fin);
  if (message) {
    throw new Error(message);
  }
}

function refIdOrZero(raw: string): number | undefined {
  const t = trimmed(raw);
  if (t === "") {
    return 0;
  }
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  return n;
}

export type PortageProjetWriteFields = Partial<{
  Nom_du_projet: string;
  Statut: string | null;
  Porteur: string | null;
  Financeur: string | null;
  Equipe: string | null;
  Freelance: number;
  Responsable_du_projet: number;
  Bon_de_commande: number;
  Date_de_debut: number | null;
  Date_de_fin: number | null;
}>;

/** Champs create — le nom est obligatoire ; les vides ne sont pas envoyés. */
export function buildPortageProjetCreateFields(
  values: PortageProjetFormValues,
): PortageProjetWriteFields {
  const nom = trimmed(values.Nom_du_projet);
  if (!nom) {
    throw new Error("Le nom du portage est obligatoire.");
  }
  assertPortageDateOrder(values);
  const out: PortageProjetWriteFields = { Nom_du_projet: nom };

  for (const field of TEXT_FIELDS) {
    if (field === "Nom_du_projet") {
      continue;
    }
    const text = trimmed(values[field]);
    if (text) {
      out[field] = text;
    }
  }
  for (const field of REF_FIELDS) {
    const id = refIdOrZero(values[field]);
    if (id != null && id > 0) {
      out[field] = id;
    }
  }
  for (const field of DATE_FIELDS) {
    const ts = dateInputToGristTimestamp(values[field]);
    if (ts != null) {
      out[field] = ts;
    }
  }
  return out;
}

function skipUntouchedInvalid(
  field: PortageProjetFormField,
  next: string,
  invalid: ReadonlySet<PortageProjetFormField>,
): boolean {
  return invalid.has(field) && trimmed(next) === "";
}

/**
 * Patch différentiel. Une cellule illisible encore vide n’est pas réécrite.
 */
export function buildPortageProjetPatch(
  values: PortageProjetFormValues,
  init: PortageProjetFormValues,
  invalid: ReadonlySet<PortageProjetFormField> = new Set(),
): PortageProjetWriteFields {
  assertPortageDateOrder(values);
  const out: PortageProjetWriteFields = {};

  for (const field of TEXT_FIELDS) {
    if (trimmed(values[field]) === trimmed(init[field])) {
      continue;
    }
    if (skipUntouchedInvalid(field, values[field], invalid)) {
      continue;
    }
    const text = trimmed(values[field]);
    if (field === "Nom_du_projet") {
      if (text) {
        out.Nom_du_projet = text;
      }
      continue;
    }
    out[field] = text === "" ? null : text;
  }

  for (const field of REF_FIELDS) {
    if (trimmed(values[field]) === trimmed(init[field])) {
      continue;
    }
    if (skipUntouchedInvalid(field, values[field], invalid)) {
      continue;
    }
    const id = refIdOrZero(values[field]);
    if (id != null) {
      out[field] = id;
    }
  }

  for (const field of DATE_FIELDS) {
    if (trimmed(values[field]) === trimmed(init[field])) {
      continue;
    }
    if (skipUntouchedInvalid(field, values[field], invalid)) {
      continue;
    }
    out[field] = dateInputToGristTimestamp(values[field]);
  }

  return out;
}

export function countPrestationsLinkedToPortage(
  prestations: readonly { Portage_Projet?: unknown }[],
  portageId: number,
): number {
  if (!Number.isFinite(portageId) || portageId <= 0) {
    return 0;
  }
  let n = 0;
  for (const row of prestations) {
    if (extractGristReferenceId(row.Portage_Projet) === portageId) {
      n += 1;
    }
  }
  return n;
}

export function portageDeleteBlockMessage(linkedPrestationCount: number): string {
  if (linkedPrestationCount <= 1) {
    return "Une prestation est encore rattachée à ce portage. Retirez le rattachement avant de supprimer.";
  }
  return `${linkedPrestationCount} prestations sont encore rattachées à ce portage. Retirez les rattachements avant de supprimer.`;
}

/** Refuse la suppression tant qu’une prestation pointe vers le projet. */
export function assertPortageProjetDeletable(linkedPrestationCount: number): void {
  if (!Number.isInteger(linkedPrestationCount) || linkedPrestationCount < 0) {
    throw new Error("Nombre de prestations liées invalide.");
  }
  if (linkedPrestationCount > 0) {
    throw new Error(portageDeleteBlockMessage(linkedPrestationCount));
  }
}

export type PortageProjetSearchLabels = {
  personLabel: (id: string) => string;
  bdcLabel: (id: string) => string;
};

export function portageProjetSearchText(
  row: PortageProjetAdminRow,
  labels: PortageProjetSearchLabels,
): string {
  const parts: string[] = [
    row.values.Nom_du_projet,
    row.values.Statut,
    row.values.Porteur,
    row.values.Financeur,
    row.values.Equipe,
  ];
  if (row.values.Freelance) {
    parts.push(labels.personLabel(row.values.Freelance));
  }
  if (row.values.Responsable_du_projet) {
    parts.push(labels.personLabel(row.values.Responsable_du_projet));
  }
  if (row.values.Bon_de_commande) {
    parts.push(labels.bdcLabel(row.values.Bon_de_commande));
  }
  if (row.invalid.size > 0) {
    parts.push(PORTAGE_VALEUR_A_CORRIGER);
  }
  return parts.join(" ").toLocaleLowerCase("fr");
}

export function filterPortageProjetAdminRows(
  rows: readonly PortageProjetAdminRow[],
  query: string,
  labels: PortageProjetSearchLabels,
): PortageProjetAdminRow[] {
  const q = query.trim().toLocaleLowerCase("fr");
  if (!q) {
    return [...rows];
  }
  return rows.filter((row) => portageProjetSearchText(row, labels).includes(q));
}

export function displayPortageField(
  row: PortageProjetAdminRow,
  field: PortageProjetFormField,
  label?: string,
): string {
  if (row.invalid.has(field)) {
    return PORTAGE_VALEUR_A_CORRIGER;
  }
  const raw = (label ?? row.values[field]).trim();
  return raw || "—";
}
