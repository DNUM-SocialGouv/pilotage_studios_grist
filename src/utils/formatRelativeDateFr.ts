/**
 * Date relative en français (jours calendaires, fuseau local).
 * Ex. : aujourd'hui, hier, il y a 3 jours, il y a 1 semaine…
 */

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Nombre de jours calendaires locaux entre `from` et `to` (to − from). */
export function calendarDaysBetween(from: Date, to: Date): number {
  const a = startOfLocalDay(from).getTime();
  const b = startOfLocalDay(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Libellé relatif FR pour une date passée (ou aujourd’hui).
 * Dates futures → date courte fr-FR (secours).
 */
export function formatRelativeDateFr(
  date: Date,
  now: Date = new Date(),
): string {
  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) {
    return "";
  }
  const diffDays = calendarDaysBetween(date, now);
  if (diffDays < 0) {
    return date.toLocaleDateString("fr-FR");
  }
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 14) return "il y a 1 semaine";
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks <= 1 ? "il y a 1 semaine" : `il y a ${weeks} semaines`;
  }
  if (diffDays < 45) return "il y a 1 mois";
  if (diffDays < 365) {
    const months = Math.max(1, Math.floor(diffDays / 30));
    return months === 1 ? "il y a 1 mois" : `il y a ${months} mois`;
  }
  const years = Math.max(1, Math.floor(diffDays / 365));
  return years === 1 ? "il y a 1 an" : `il y a ${years} ans`;
}
