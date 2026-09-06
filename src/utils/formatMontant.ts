/** Montant EUR (fr-FR). Valeur vide, NaN ou non finie → tiret cadratin. */
export function formatMontantEur(n: number | null | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) {
    return "—";
  }
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
