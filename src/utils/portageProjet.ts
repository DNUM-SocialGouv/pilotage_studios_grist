import type { BDC, PortageProjet } from "../types.ts";
import { extractGristReferenceId } from "./gristReferences.ts";

/** Porteur plateforme ciblé V1 (demande Norman). */
export const PORTAGE_PORTEUR_MALT = "Malt";

export type PortageProjetOption = {
  id: number;
  label: string;
  bdcId: number | null;
};

export type PortageProjetDisplay = {
  titreMalt: string;
  bdcLabel: string | null;
};

/** True si la ligne est un projet Malt (porteur exact). */
export function isPortageProjetMalt(row: PortageProjet): boolean {
  return (row.Porteur?.trim() ?? "") === PORTAGE_PORTEUR_MALT;
}

/**
 * Options select « Projet Malt » pour un intervenant (= Freelance sur Portage_Projet).
 * Inclut `selectedId` même hors filtre (ligne orpheline / autre porteur) pour ne pas perdre l’édition.
 */
export function maltPortageOptionsForFreelance(
  rows: readonly PortageProjet[],
  freelanceId: number | null | undefined,
  selectedId?: number | null,
): PortageProjetOption[] {
  const out: PortageProjetOption[] = [];
  const seen = new Set<number>();

  const push = (row: PortageProjet) => {
    if (seen.has(row.id)) {
      return;
    }
    seen.add(row.id);
    const titre = row.Nom_du_projet?.trim() || `Projet Malt #${row.id}`;
    const bdcId = extractGristReferenceId(row.Bon_de_commande);
    out.push({
      id: row.id,
      label: titre,
      bdcId: bdcId != null && bdcId !== 0 ? bdcId : null,
    });
  };

  if (freelanceId != null && freelanceId !== 0) {
    for (const row of rows) {
      if (!isPortageProjetMalt(row)) {
        continue;
      }
      const fid = extractGristReferenceId(row.Freelance);
      if (fid === freelanceId) {
        push(row);
      }
    }
  }

  if (selectedId != null && selectedId !== 0 && !seen.has(selectedId)) {
    const orphan = rows.find((r) => r.id === selectedId);
    if (orphan) {
      push(orphan);
    }
  }

  out.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
  return out;
}

/** Libellé BDC pour aperçu (nom, sinon Chorus, sinon #id). */
export function bdcDisplayLabel(
  bdc: Pick<BDC, "id" | "Nom_BdC" | "BdC_Chorus"> | undefined,
  bdcId: number | null | undefined,
): string | null {
  if (bdcId == null || bdcId === 0) {
    return null;
  }
  if (bdc) {
    const nom = bdc.Nom_BdC?.trim();
    if (nom) {
      return nom;
    }
    const chorus = bdc.BdC_Chorus?.trim();
    if (chorus) {
      return `Chorus ${chorus}`;
    }
  }
  return `BDC #${bdcId}`;
}

/**
 * True si la ligne est une option Malt valide pour ce freelance
 * (sans tenir compte d’une sélection orpheline).
 */
export function isMaltPortageValidForFreelance(
  rows: readonly PortageProjet[],
  portageId: number | null | undefined,
  freelanceId: number | null | undefined,
): boolean {
  if (portageId == null || portageId === 0) {
    return false;
  }
  return maltPortageOptionsForFreelance(rows, freelanceId).some(
    (o) => o.id === portageId,
  );
}

/** Affichage fiche : intitulé Malt + BDC dérivé (BDC optionnel). */
export function resolvePortageProjetDisplay(
  row: PortageProjet | undefined,
  bdcById?: Map<number, Pick<BDC, "id" | "Nom_BdC" | "BdC_Chorus">>,
): PortageProjetDisplay | null {
  if (!row) {
    return null;
  }
  const titreMalt = row.Nom_du_projet?.trim() || `Projet Malt #${row.id}`;
  const bdcId = extractGristReferenceId(row.Bon_de_commande);
  const bdc =
    bdcId != null && bdcId !== 0 ? bdcById?.get(bdcId) : undefined;
  return {
    titreMalt,
    bdcLabel: bdcDisplayLabel(bdc, bdcId),
  };
}
