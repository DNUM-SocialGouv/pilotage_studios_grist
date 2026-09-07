import { asGristChoice } from "./gristReferences.ts";

function columnKeySuggestsPeriodColumn(key: string): boolean {
  const kl = key.toLowerCase().replace(/é/g, "e");
  return /(periode|period|(^|_)mois($|_)|annee|year|trimestre|semaine|month|facturation|echeance)/i.test(
    kl,
  );
}

function stringLooksLikePeriodOrCalendarLabel(text: string): boolean {
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
  if (/^\d{4}-\d{2}$/.test(t)) {
    return true;
  }
  return false;
}

/** Libellé affichable pour une ligne produit Grist (ids de colonnes variables). */
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
    if (t && !stringLooksLikePeriodOrCalendarLabel(t)) {
      return t;
    }
  }

  for (const [k, v] of Object.entries(record)) {
    if (k === "id") {
      continue;
    }
    if (columnKeySuggestsPeriodColumn(k)) {
      continue;
    }
    if (typeof v !== "string") {
      continue;
    }
    const t = v.trim();
    if (t.length < 2) {
      continue;
    }
    if (stringLooksLikePeriodOrCalendarLabel(t)) {
      continue;
    }
    const kl = k.toLowerCase().replace(/é/g, "e");
    if (/(slug|^url|lien_|^id_|uuid|chorus|bdc)/i.test(kl)) {
      continue;
    }
    if (/(nom|libel|intitul|titre|name|label|title|produit|designation)/i.test(kl)) {
      return t;
    }
  }

  let best = "";
  for (const [k, v] of Object.entries(record)) {
    if (k === "id" || k === "manualSort") {
      continue;
    }
    if (columnKeySuggestsPeriodColumn(k)) {
      continue;
    }
    if (typeof v !== "string") {
      continue;
    }
    const t = v.trim();
    if (t.length < 3) {
      continue;
    }
    if (stringLooksLikePeriodOrCalendarLabel(t)) {
      continue;
    }
    const kl = k.toLowerCase();
    if (
      /grist|^_grist|chorus|bdc|url|email|^id_|uuid|slug|attachment|fichier|lien/i.test(kl)
    ) {
      continue;
    }
    if (t.length > best.length) {
      best = t;
    }
  }
  if (best) {
    return best;
  }

  return `Produit #${id}`;
}
