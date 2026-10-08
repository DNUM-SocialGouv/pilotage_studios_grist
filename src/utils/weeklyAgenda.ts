/**
 * Helpers agenda Weekly Ops (`Weekly_agenda`).
 *
 * Auteur prérempli : prénom seul —
 * 1) `Equipe.Prenom_Nom` (session) → premier mot via `firstNameFromDisplayName`
 * 2) sinon e-mail session → segment avant le premier `.` / `_` / `-` (pas `prenom.nom`)
 */

import type { WeeklyAgendaRow } from "../types.ts";
import { formatRelativeDateFr } from "./formatRelativeDateFr.ts";
import { firstNameFromDisplayName } from "./welcomeHomeByRole.ts";

/** Prénom depuis la partie locale d’un e-mail (`olivier.toumsy` → `Olivier`). */
export function prenomFromEmailLocalPart(
  email: string | null | undefined,
): string | null {
  const local = email?.split("@")[0]?.trim() ?? "";
  if (!local) return null;
  const first = local.split(/[._-]/)[0]?.trim() ?? "";
  if (!first) return null;
  return first.charAt(0).toLocaleUpperCase("fr-FR") + first.slice(1);
}

/**
 * Valeur par défaut du champ « Votre prénom (auteur) ».
 * Priorité : fiche Équipe (`displayName`) puis parse e-mail session.
 */
export function defaultWeeklyAuteurPrenom(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  return (
    firstNameFromDisplayName(displayName) ??
    prenomFromEmailLocalPart(email) ??
    ""
  );
}

/** Parse date Grist (secondes / ISO) → Date locale, ou null. */
export function parseWeeklyAgendaDateValue(
  value: string | number | null | undefined,
): Date | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value === 0) return null;
    return new Date(value * 1000);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && asNumber > 1_000_000_000) {
    return new Date(asNumber * 1000);
  }
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

/** Parse `Weekly_agenda.Cree_le` → Date locale, ou null. */
export function parseWeeklyAgendaCreatedAt(
  value: string | number | null | undefined,
): Date | null {
  return parseWeeklyAgendaDateValue(value);
}

/** Parse `Weekly_agenda.Traite_le` → Date locale, ou null. */
export function parseWeeklyAgendaTraiteLe(
  value: string | number | null | undefined,
): Date | null {
  return parseWeeklyAgendaDateValue(value);
}

/** Clé jour local `YYYY-MM-DD` pour regroupement timeline. */
export function weeklyAgendaDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Clé mois local `YYYY-MM`. */
export function weeklyAgendaMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Libellé pastille court (« Ven 25 sept »). */
export function formatWeeklyAgendaDayShort(date: Date): string {
  const raw = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  // Retire le point éventuel après l’abréviation du jour (« ven. » → « Ven »).
  return raw.replace(/\./g, "").replace(/^(\S)/, (c) => c.toLocaleUpperCase("fr-FR"));
}

/** Libellé accessible long (« vendredi 25 septembre 2026 »). */
export function formatWeeklyAgendaDayLong(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Libellé mois (« Septembre 2026 »). */
export function formatWeeklyAgendaMonthLabel(date: Date): string {
  const raw = date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return raw.charAt(0).toLocaleUpperCase("fr-FR") + raw.slice(1);
}

export type WeeklyAgendaHistoryDay = {
  dayKey: string;
  date: Date;
  labelShort: string;
  labelLong: string;
  sujets: WeeklyAgendaRow[];
};

export type WeeklyAgendaHistoryMonth = {
  monthKey: string;
  label: string;
  days: WeeklyAgendaHistoryDay[];
  sujetCount: number;
};

/**
 * Sujets traités regroupés par jour de `Traite_le` (pastille = jour exact).
 * Sans `Traite_le` : best-effort `Cree_le` ; sinon bucket « Sans date ».
 * Ordre : mois récents d’abord, jours récents d’abord dans le mois.
 */
export function groupWeeklyAgendaHistory(
  agenda: readonly WeeklyAgendaRow[],
): WeeklyAgendaHistoryMonth[] {
  const treated = agenda.filter((s) => Boolean(s.Traite));
  type Bucket = {
    dayKey: string;
    date: Date | null;
    sujets: WeeklyAgendaRow[];
  };
  const byDay = new Map<string, Bucket>();

  for (const sujet of treated) {
    const traiteLe = parseWeeklyAgendaTraiteLe(sujet.Traite_le);
    const fallback = traiteLe ?? parseWeeklyAgendaCreatedAt(sujet.Cree_le);
    const dayKey = fallback ? weeklyAgendaDayKey(fallback) : "sans-date";
    let bucket = byDay.get(dayKey);
    if (!bucket) {
      bucket = { dayKey, date: fallback, sujets: [] };
      byDay.set(dayKey, bucket);
    }
    bucket.sujets.push(sujet);
  }

  const days: WeeklyAgendaHistoryDay[] = [...byDay.values()].map((b) => {
    const date = b.date ?? new Date(0);
    return {
      dayKey: b.dayKey,
      date,
      labelShort:
        b.dayKey === "sans-date" ? "Sans date" : formatWeeklyAgendaDayShort(date),
      labelLong:
        b.dayKey === "sans-date"
          ? "Sujets traités sans date de traitement"
          : formatWeeklyAgendaDayLong(date),
      sujets: b.sujets.sort((a, b2) => b2.id - a.id),
    };
  });

  days.sort((a, b) => {
    if (a.dayKey === "sans-date") return 1;
    if (b.dayKey === "sans-date") return -1;
    return b.dayKey.localeCompare(a.dayKey);
  });

  const months = new Map<string, WeeklyAgendaHistoryMonth>();
  for (const day of days) {
    const monthKey =
      day.dayKey === "sans-date" ? "sans-date" : weeklyAgendaMonthKey(day.date);
    let month = months.get(monthKey);
    if (!month) {
      month = {
        monthKey,
        label:
          monthKey === "sans-date"
            ? "Sans date"
            : formatWeeklyAgendaMonthLabel(day.date),
        days: [],
        sujetCount: 0,
      };
      months.set(monthKey, month);
    }
    month.days.push(day);
    month.sujetCount += day.sujets.length;
  }

  return [...months.values()];
}

/**
 * Affiche `Weekly_agenda.Cree_le` en relatif FR
 * (aujourd'hui, hier, il y a N jours… — via `formatRelativeDateFr`).
 */
export function formatWeeklyAgendaCreatedAt(
  value: string | number | null | undefined,
  now: Date = new Date(),
): string {
  const date = parseWeeklyAgendaCreatedAt(value);
  if (!date) return "";
  return formatRelativeDateFr(date, now);
}

/** Prénom seul pour l’affichage méta d’un sujet (secours : valeur brute). */
export function weeklyAgendaAuteurPrenom(
  auteur: string | null | undefined,
): string {
  const raw = (auteur ?? "").trim();
  if (!raw || raw === "—") return "—";
  return firstNameFromDisplayName(raw) ?? raw;
}
