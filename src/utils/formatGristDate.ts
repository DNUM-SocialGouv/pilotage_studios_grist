/** Timestamp Grist en secondes depuis l’epoch Unix. */
export function formatGristDate(timestamp: number | undefined | null): string {
  if (timestamp == null || timestamp === 0 || !Number.isFinite(timestamp)) {
    return "—";
  }
  return new Date(timestamp * 1000).toLocaleDateString("fr-FR");
}

/** Affichage « mars 2026 » (mois / année, même calendrier que `formatGristDate`). */
export function formatGristMonthYear(timestamp: number | undefined | null): string {
  if (timestamp == null || timestamp === 0 || !Number.isFinite(timestamp)) {
    return "—";
  }
  return new Date(timestamp * 1000).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

/** DateTime Grist (secondes) → date + heure locale fr-FR. */
export function formatGristDateTime(timestamp: number | undefined | null): string {
  if (timestamp == null || timestamp === 0 || !Number.isFinite(timestamp)) {
    return "—";
  }
  return new Date(timestamp * 1000).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
