export type StatutBadgeSeverity = "success" | "error" | "info" | "warning" | "new";

/** Sévérité DSFR d’un libellé de statut (BDC / missions). */
export function severityForStatut(statut: string | undefined): StatutBadgeSeverity {
  const s = statut?.toLowerCase() ?? "";
  if (s.includes("sold")) return "success";
  if (s.includes("cours")) return "new";
  if (s.includes("annul")) return "error";
  return "info";
}

/** Sévérité DSFR pour le statut d’une fiche Équipe (Actif / Inactif…). */
export function severityForEquipeStatut(
  statut: string | undefined,
): StatutBadgeSeverity {
  const s = statut?.toLowerCase().trim() ?? "";
  if (!s) return "info";
  if (s.includes("inactif")) return "warning";
  if (s.includes("actif")) return "success";
  return severityForStatut(statut);
}
