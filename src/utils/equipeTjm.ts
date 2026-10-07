/**
 * Grille tarifs journaliers `Equipe_TJM` — personne × spécialité × période.
 * Clôture manuelle (pas de fermeture auto à l’ajout).
 */

import { extractGristReferenceId } from "./gristReferences.ts";
import {
  dateInputToGristTimestamp,
  gristTimestampToDateInput,
} from "./missionEnfantFormFields.ts";
import { parseOptionalTjm } from "./equipeFormFields.ts";

export type EquipeTjmRow = {
  id: number;
  Personne: number;
  Specialite: string;
  TJM: number;
  Date_debut: number;
  Date_fin?: number;
  Commentaire?: string;
};

/** Ligne brouillon UI (drawer Admin). */
export type EquipeTjmDraftLine = {
  /** Clé React stable. */
  key: string;
  /** Id Grist si déjà persistée. */
  id?: number;
  Specialite: string;
  /** Montant formulaire (chaîne). */
  TJM: string;
  /** `YYYY-MM-DD`. */
  Date_debut: string;
  /** `YYYY-MM-DD` ou vide = ouvert. */
  Date_fin: string;
  Commentaire: string;
};

export type EquipeTjmWriteFields = {
  Personne: number;
  Specialite: string;
  TJM: number;
  Date_debut: number;
  Date_fin?: number | null;
  Commentaire?: string;
};

export function emptyEquipeTjmDraftLine(): EquipeTjmDraftLine {
  return {
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    Specialite: "",
    TJM: "",
    Date_debut: "",
    Date_fin: "",
    Commentaire: "",
  };
}

export function rowToEquipeTjmDraft(row: EquipeTjmRow): EquipeTjmDraftLine {
  return {
    key: `id-${row.id}`,
    id: row.id,
    Specialite: row.Specialite,
    TJM: Number.isFinite(row.TJM) ? String(row.TJM) : "",
    Date_debut: gristTimestampToDateInput(row.Date_debut),
    Date_fin: gristTimestampToDateInput(row.Date_fin),
    Commentaire: row.Commentaire?.trim() ?? "",
  };
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const t = value.trim();
    if (!t || t === "CENSORED" || t === "..." || t.startsWith("[Pending")) {
      return undefined;
    }
    return t;
  }
  return undefined;
}

/** Mappe un enregistrement `fetchTable` / plugin vers une ligne grille. */
export function toEquipeTjmRow(record: {
  id: number;
  Personne?: unknown;
  Specialite?: unknown;
  TJM?: unknown;
  Date_debut?: unknown;
  Date_fin?: unknown;
  Commentaire?: unknown;
}): EquipeTjmRow | null {
  const personne = extractGristReferenceId(record.Personne);
  const specialite = asString(record.Specialite);
  const tjm = asNumber(record.TJM);
  const debut = asNumber(record.Date_debut);
  if (
    personne == null ||
    !specialite ||
    tjm == null ||
    debut == null ||
    debut === 0
  ) {
    return null;
  }
  const fin = asNumber(record.Date_fin);
  return {
    id: record.id,
    Personne: personne,
    Specialite: specialite,
    TJM: tjm,
    Date_debut: debut,
    Date_fin: fin != null && fin !== 0 ? fin : undefined,
    Commentaire: asString(record.Commentaire),
  };
}

/** Tarif encore en vigueur (pas de fin, ou fin ≥ aujourd’hui minuit local, inclusive). */
export function isEquipeTjmOpen(row: Pick<EquipeTjmRow, "Date_fin">): boolean {
  if (row.Date_fin == null) {
    return true;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = Math.floor(today.getTime() / 1000);
  return row.Date_fin >= todayStart;
}

export function sortEquipeTjmRows(rows: readonly EquipeTjmRow[]): EquipeTjmRow[] {
  return [...rows].sort((a, b) => {
    const spe = a.Specialite.localeCompare(b.Specialite, "fr", { sensitivity: "base" });
    if (spe !== 0) {
      return spe;
    }
    if (a.Date_debut !== b.Date_debut) {
      return b.Date_debut - a.Date_debut;
    }
    return b.id - a.id;
  });
}

export function filterEquipeTjmForPersonne(
  rows: readonly EquipeTjmRow[],
  personneId: number,
): EquipeTjmRow[] {
  return sortEquipeTjmRows(rows.filter((r) => r.Personne === personneId));
}

/**
 * Chevauchement inclusif sur [debut, fin] (fin absente = +∞).
 * Deux périodes se chevauchent si debutA ≤ finB et debutB ≤ finA.
 */
export function periodsOverlapInclusive(
  aStart: number,
  aEnd: number | null | undefined,
  bStart: number,
  bEnd: number | null | undefined,
): boolean {
  const aFin = aEnd == null ? Number.POSITIVE_INFINITY : aEnd;
  const bFin = bEnd == null ? Number.POSITIVE_INFINITY : bEnd;
  return aStart <= bFin && bStart <= aFin;
}

export type EquipeTjmDraftValidation =
  | { ok: true; writes: { id?: number; fields: EquipeTjmWriteFields }[] }
  | { ok: false; message: string };

/**
 * Valide les brouillons pour une personne (chevauchements même spécialité interdits).
 */
export function validateEquipeTjmDrafts(
  personneId: number,
  drafts: readonly EquipeTjmDraftLine[],
): EquipeTjmDraftValidation {
  if (!Number.isFinite(personneId) || personneId <= 0) {
    return { ok: false, message: "Personne invalide pour les tarifs." };
  }

  const parsed: {
    draft: EquipeTjmDraftLine;
    specialite: string;
    tjm: number;
    debut: number;
    fin: number | null;
    commentaire: string;
  }[] = [];

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i]!;
    const label = `tarif n°${i + 1}`;
    const specialite = draft.Specialite.trim();
    if (!specialite) {
      return { ok: false, message: `${label} : choisissez une spécialité.` };
    }
    const tjm = parseOptionalTjm(draft.TJM);
    if (tjm === null || tjm === "invalid") {
      return {
        ok: false,
        message: `${label} : indiquez un montant positif (ou zéro).`,
      };
    }
    const debut = dateInputToGristTimestamp(draft.Date_debut);
    if (debut == null) {
      return {
        ok: false,
        message: `${label} : la date de début est obligatoire.`,
      };
    }
    const finRaw = draft.Date_fin.trim();
    const fin = finRaw ? dateInputToGristTimestamp(finRaw) : null;
    if (finRaw && fin == null) {
      return { ok: false, message: `${label} : date de fin invalide.` };
    }
    if (fin != null && fin < debut) {
      return {
        ok: false,
        message: `${label} : la fin doit être après le début (ou égale).`,
      };
    }
    parsed.push({
      draft,
      specialite,
      tjm,
      debut,
      fin,
      commentaire: draft.Commentaire.trim(),
    });
  }

  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      const a = parsed[i]!;
      const b = parsed[j]!;
      if (a.specialite !== b.specialite) {
        continue;
      }
      if (periodsOverlapInclusive(a.debut, a.fin, b.debut, b.fin)) {
        return {
          ok: false,
          message: `Chevauchement sur « ${a.specialite} » : indiquez la fin de l’ancien tarif avant d’ouvrir le nouveau. Rien n’est clôturé automatiquement.`,
        };
      }
    }
  }

  return {
    ok: true,
    writes: parsed.map((p) => ({
      id: p.draft.id,
      fields: {
        Personne: personneId,
        Specialite: p.specialite,
        TJM: p.tjm,
        Date_debut: p.debut,
        Date_fin: p.fin,
        ...(p.commentaire ? { Commentaire: p.commentaire } : { Commentaire: "" }),
      },
    })),
  };
}
