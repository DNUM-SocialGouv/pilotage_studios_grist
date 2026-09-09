export type StatutBadgeSeverity = "success" | "error" | "info" | "warning" | "new";

/** Sévérité DSFR d’un libellé de statut (BDC / missions). */
export function severityForStatut(statut: string | undefined): StatutBadgeSeverity {
  const s = statut?.toLowerCase() ?? "";
  if (s.includes("sold")) return "success";
  if (s.includes("cours")) return "new";
  if (s.includes("annul")) return "error";
  return "info";
}
