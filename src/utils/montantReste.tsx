import type { ReactNode } from "react";
import { formatMontantEur } from "./formatMontant";

/** Montant EUR ; rouge si négatif. Valeur absente / non finie → « — ». */
export function montantReste(value: number | null | undefined): ReactNode {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  const formatted = formatMontantEur(value);
  if (value < 0) {
    return <span style={{ color: "var(--text-default-error)" }}>{formatted}</span>;
  }
  return formatted;
}
