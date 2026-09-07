import { asGristChoice } from "./gristReferences.ts";

function isPeriodOrCalendarLabel(text: string): boolean {
  const t = text.trim();
  if (
    /^(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4}$/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^T[1-4]\s*\d{4}$/i.test(t)) {
    return true;
  }
  return /^\d{4}-\d{2}$/.test(t);
}

/** Libellé affichable : colonnes nom uniquement (pas de fallback « plus longue chaîne »). */
export function libelleProduitGrist(record: Record<string, unknown>, id: number): string {
  const preferredKeys = [
    "Produit",
    "nom",
    "Nom",
    "NOM",
    "Libelle",
    "Libellé",
    "Intitule",
    "Intitulé",
    "Name",
    "name",
    "Titre",
    "titre",
    "Nom_du_produit",
    "Nom_produit",
    "Designation",
    "Désignation",
    "Label",
  ];

  for (const k of preferredKeys) {
    const t = asGristChoice(record[k]);
    if (t && !isPeriodOrCalendarLabel(t)) {
      return t;
    }
  }

  return `Produit #${id}`;
}
