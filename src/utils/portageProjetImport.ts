/**
 * Import CSV des portages — lecture et vérification, sans écriture Grist.
 * Une ligne n’est « prête » que si le nom est nouveau, les personnes et le bon
 * de commande sont reconnus (ou vides), et les dates sont dans le bon ordre.
 */

import { dateInputToGristTimestamp } from "./missionEnfantFormFields.ts";
import {
  emptyPortageProjetForm,
  portageDateOrderMessage,
  type PortageProjetFormValues,
} from "./portageProjetFormFields.ts";

export const PORTAGE_IMPORT_MAX_ROWS = 500;

export const PORTAGE_IMPORT_HEADERS = [
  "Nom du projet",
  "Statut",
  "Porteur",
  "Financeur",
  "Équipe",
  "Personne",
  "Responsable",
  "Bon de commande",
  "Date de début",
  "Date de fin",
] as const;

const HEADER_FIELDS = {
  "nom du projet": "Nom_du_projet",
  statut: "Statut",
  porteur: "Porteur",
  financeur: "Financeur",
  equipe: "Equipe",
  personne: "Freelance",
  responsable: "Responsable_du_projet",
  "responsable du projet": "Responsable_du_projet",
  "bon de commande": "Bon_de_commande",
  "date de debut": "Date_de_debut",
  "date de fin": "Date_de_fin",
} as const;

type ImportField = (typeof HEADER_FIELDS)[keyof typeof HEADER_FIELDS];

export type PortageImportPerson = { id: number; name: string };
export type PortageImportBdc = { id: number; nom?: string; chorus?: string };

export type PortageImportCatalog = {
  existingNames: readonly string[];
  people: readonly PortageImportPerson[];
  peopleReady: boolean;
  bdcs: readonly PortageImportBdc[];
  bdcReady: boolean;
};

export function portageImportCatalogFromLists(input: {
  names: readonly string[];
  people: readonly PortageImportPerson[];
  peopleReady: boolean;
  bdcs: readonly PortageImportBdc[];
  bdcReady: boolean;
}): PortageImportCatalog {
  return {
    existingNames: input.names,
    people: input.people,
    peopleReady: input.peopleReady,
    bdcs: input.bdcs,
    bdcReady: input.bdcReady,
  };
}

export type PortageImportLine = {
  line: number;
  nom: string;
  status: "ready" | "blocked";
  messages: string[];
  values?: PortageProjetFormValues;
};

export type PortageImportPreview = {
  lines: PortageImportLine[];
  readyCount: number;
  blockedCount: number;
  fileError?: string;
};

export function normalizePortageKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

export function portageImportTemplateCsv(): string {
  return `\uFEFF${PORTAGE_IMPORT_HEADERS.join(";")}\n`;
}

export function portageImportReadyKey(preview: PortageImportPreview): string {
  return preview.lines
    .filter((line) => line.status === "ready")
    .map((line) => `${line.line}\t${normalizePortageKey(line.nom)}`)
    .join("\n");
}

type CsvRow = { line: number; cells: string[] };

function parseCsv(text: string, delimiter: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;
  const source = text.replace(/^\uFEFF/, "");

  const pushRow = () => {
    if (row.some((value) => value.trim() !== "")) {
      rows.push({ line: rowLine, cells: row });
    }
    row = [];
    cell = "";
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]!;
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === "\n") {
          line += 1;
        }
        if (char !== "\r") {
          cell += char;
        }
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      pushRow();
      line += 1;
      rowLine = line;
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    pushRow();
  }
  return rows;
}

function delimiterOf(text: string): string {
  const first = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  return first.includes(";") ? ";" : ",";
}

function toIsoDate(raw: string): { iso: string; error?: string } {
  const value = raw.trim();
  if (!value) {
    return { iso: "" };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (dateInputToGristTimestamp(value) == null) {
      return { iso: "", error: `Date invalide : ${value}.` };
    }
    return { iso: value };
  }
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value);
  if (!match) {
    return { iso: "", error: `Date illisible : ${value}. Utilisez JJ/MM/AAAA.` };
  }
  const iso = `${match[3]}-${match[2]!.padStart(2, "0")}-${match[1]!.padStart(2, "0")}`;
  if (dateInputToGristTimestamp(iso) == null) {
    return { iso: "", error: `Date invalide : ${value}.` };
  }
  return { iso };
}

function matchByName(
  label: string,
  raw: string,
  items: readonly { id: number; keys: string[] }[],
  ready: boolean,
  unreadMessage: string,
): { id: string; messages: string[] } {
  const text = raw.trim();
  if (!text) {
    return { id: "", messages: [] };
  }
  if (!ready) {
    return { id: "", messages: [unreadMessage] };
  }
  const key = normalizePortageKey(text);
  const hits = items.filter((item) => item.keys.some((candidate) => candidate === key));
  const ids = [...new Set(hits.map((item) => item.id))];
  if (ids.length === 1) {
    return { id: String(ids[0]), messages: [] };
  }
  if (ids.length === 0) {
    return { id: "", messages: [`${label} introuvable : ${text}.`] };
  }
  return {
    id: "",
    messages: [`Plusieurs fiches correspondent à « ${text} » (${label}).`],
  };
}

export function previewPortageImport(
  csv: string,
  catalog: PortageImportCatalog,
): PortageImportPreview {
  const trimmed = csv.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { lines: [], readyCount: 0, blockedCount: 0, fileError: "Le fichier est vide." };
  }
  const table = parseCsv(csv, delimiterOf(csv));
  const header = table[0];
  if (!header) {
    return { lines: [], readyCount: 0, blockedCount: 0, fileError: "Le fichier est vide." };
  }
  const columns = new Map<ImportField, number>();
  header.cells.forEach((label, index) => {
    const field = HEADER_FIELDS[normalizePortageKey(label) as keyof typeof HEADER_FIELDS];
    if (field && !columns.has(field)) {
      columns.set(field, index);
    }
  });
  if (!columns.has("Nom_du_projet")) {
    return {
      lines: [],
      readyCount: 0,
      blockedCount: 0,
      fileError: "La colonne « Nom du projet » est introuvable. Téléchargez le modèle.",
    };
  }
  const dataRows = table.slice(1);
  if (dataRows.length > PORTAGE_IMPORT_MAX_ROWS) {
    return {
      lines: [],
      readyCount: 0,
      blockedCount: 0,
      fileError: `${PORTAGE_IMPORT_MAX_ROWS} lignes maximum. Découpez le fichier.`,
    };
  }

  if (dataRows.length === 0) {
    return {
      lines: [],
      readyCount: 0,
      blockedCount: 0,
      fileError: "Le fichier ne contient aucune ligne à importer.",
    };
  }

  const cell = (row: string[], field: ImportField) => {
    const index = columns.get(field);
    return index == null ? "" : (row[index] ?? "").trim();
  };

  const existing = new Set(catalog.existingNames.map(normalizePortageKey).filter(Boolean));
  const seen = new Map<string, number>();
  for (const row of dataRows) {
    const key = normalizePortageKey(cell(row.cells, "Nom_du_projet"));
    if (key) {
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
  }

  const people = catalog.people.map((person) => ({
    id: person.id,
    keys: [normalizePortageKey(person.name)].filter(Boolean),
  }));
  const bdcs = catalog.bdcs.map((bdc) => {
    const chorus = (bdc.chorus ?? "").trim();
    return {
      id: bdc.id,
      keys: [bdc.nom ?? "", chorus, chorus ? `Chorus ${chorus}` : "", `bdc #${bdc.id}`]
        .map(normalizePortageKey)
        .filter(Boolean),
    };
  });

  const lines: PortageImportLine[] = dataRows.map((row) => {
    const nom = cell(row.cells, "Nom_du_projet");
    const messages: string[] = [];
    const key = normalizePortageKey(nom);
    if (!nom) {
      messages.push("Le nom du projet est obligatoire.");
    } else {
      if (existing.has(key)) {
        messages.push("Un portage porte déjà ce nom.");
      }
      if ((seen.get(key) ?? 0) > 1) {
        messages.push("Ce nom est en double dans le fichier.");
      }
    }

    const person = matchByName(
      "Personne",
      cell(row.cells, "Freelance"),
      people,
      catalog.peopleReady,
      "L’annuaire n’a pas pu être lu. Retirez la personne ou réessayez.",
    );
    const responsable = matchByName(
      "Responsable",
      cell(row.cells, "Responsable_du_projet"),
      people,
      catalog.peopleReady,
      "L’annuaire n’a pas pu être lu. Retirez le responsable ou réessayez.",
    );
    const bdc = matchByName(
      "Bon de commande",
      cell(row.cells, "Bon_de_commande"),
      bdcs,
      catalog.bdcReady,
      "Les bons de commande n’ont pas pu être lus. Retirez le bon ou réessayez.",
    );
    messages.push(...person.messages, ...responsable.messages, ...bdc.messages);

    const debut = toIsoDate(cell(row.cells, "Date_de_debut"));
    const fin = toIsoDate(cell(row.cells, "Date_de_fin"));
    if (debut.error) {
      messages.push(debut.error);
    }
    if (fin.error) {
      messages.push(fin.error);
    }
    const order = portageDateOrderMessage(debut.iso, fin.iso);
    if (order) {
      messages.push(order);
    }

    const values: PortageProjetFormValues = {
      ...emptyPortageProjetForm(),
      Nom_du_projet: nom,
      Statut: cell(row.cells, "Statut"),
      Porteur: cell(row.cells, "Porteur"),
      Financeur: cell(row.cells, "Financeur"),
      Equipe: cell(row.cells, "Equipe"),
      Freelance: person.id,
      Responsable_du_projet: responsable.id,
      Bon_de_commande: bdc.id,
      Date_de_debut: debut.iso,
      Date_de_fin: fin.iso,
    };

    return {
      line: row.line,
      nom: nom || "—",
      status: messages.length > 0 ? "blocked" : "ready",
      messages,
      values: messages.length > 0 ? undefined : values,
    };
  });

  const readyCount = lines.filter((line) => line.status === "ready").length;
  return {
    lines,
    readyCount,
    blockedCount: lines.length - readyCount,
  };
}
