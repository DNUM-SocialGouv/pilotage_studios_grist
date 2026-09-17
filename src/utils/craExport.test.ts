import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Intervenant, MissionEnfant, SuiviMensuel } from "../types.ts";
import {
  buildCraExportRows,
  buildPortageByIntervenantId,
  CRA_EXPORT_COLUMNS,
  CRA_EXPORT_SANS_PORTAGE,
  craExportCsvFilename,
  craExportRowsToCsv,
  craExportRowsToMarkdown,
  defaultCraExportColumnVisibility,
  groupCraExportByPortage,
  sanitizeCraExportFilenamePart,
  selectedCraExportColumns,
} from "./craExport.ts";

const emptyMaps = {
  intervenantsById: new Map<number, string>([
    [1, "Alice"],
    [2, "Bob"],
  ]),
  portageByIntervenantId: new Map<number, string>([
    [1, "Malt"],
    [2, CRA_EXPORT_SANS_PORTAGE],
  ]),
  bdcById: new Map<number, string>([[10, "BDC Design"]]),
  bdcChorusById: new Map<number, string>([[10, "CH-001"]]),
  produitsById: new Map<number, string>(),
  missionsById: new Map<number, string>([[100, "Mission A"]]),
  enfantsById: new Map<number, MissionEnfant>(),
};

function row(partial: Partial<SuiviMensuel> & { id: number }): SuiviMensuel {
  return {
    Periode: Date.UTC(2026, 5, 1) / 1000,
    Nb_jours: 2,
    Equipe: "Produit",
    ...partial,
  };
}

describe("buildPortageByIntervenantId", () => {
  it("mappe Portage et fallback Sans portage", () => {
    const intervenants: Intervenant[] = [
      { id: 1, Prenom_Nom: "A", Portage: "Malt" },
      { id: 2, Prenom_Nom: "B", Portage: "  " },
      { id: 3, Prenom_Nom: "C" },
    ];
    const map = buildPortageByIntervenantId(intervenants);
    assert.equal(map.get(1), "Malt");
    assert.equal(map.get(2), CRA_EXPORT_SANS_PORTAGE);
    assert.equal(map.get(3), CRA_EXPORT_SANS_PORTAGE);
  });
});

describe("groupCraExportByPortage", () => {
  it("groupe, trie et place Sans portage en dernier", () => {
    const exportRows = buildCraExportRows(
      [
        row({ id: 1, Intervenants: 2, BDC_cible: 10, Nb_jours: 1, Calcul_TTC: 100 }),
        row({ id: 2, Intervenants: 1, BDC_cible: 10, Nb_jours: 3, Calcul_TTC: 300 }),
      ],
      emptyMaps,
    );
    const groups = groupCraExportByPortage(exportRows);
    assert.equal(groups.length, 2);
    assert.equal(groups[0].portage, "Malt");
    assert.equal(groups[0].totalJours, 3);
    assert.equal(groups[1].portage, CRA_EXPORT_SANS_PORTAGE);
  });
});

describe("craExportRowsToCsv", () => {
  it("produit un CSV avec BOM et séparateur ;", () => {
    const exportRows = buildCraExportRows(
      [row({ id: 1, Intervenants: 1, BDC_cible: 10, Nb_jours: 2.5, Calcul_TTC: 1234.5 })],
      emptyMaps,
    );
    const cols = selectedCraExportColumns(defaultCraExportColumnVisibility());
    const csv = craExportRowsToCsv(exportRows, cols);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes("Portage;Intervenant"));
    assert.ok(csv.includes("Malt;Alice"));
    assert.ok(csv.includes("CH-001"));
    assert.ok(csv.includes("2,5"));
  });
});

describe("craExportRowsToMarkdown", () => {
  it("produit un tableau Markdown", () => {
    const exportRows = buildCraExportRows(
      [row({ id: 1, Intervenants: 1, BDC_cible: 10 })],
      emptyMaps,
    );
    const md = craExportRowsToMarkdown(exportRows, [CRA_EXPORT_COLUMNS[0], CRA_EXPORT_COLUMNS[1]]);
    assert.ok(md.includes("| Portage | Intervenant |"));
    assert.ok(md.includes("| Malt | Alice |"));
  });
});

describe("filenames", () => {
  it("sanitize et nomme le CSV", () => {
    assert.equal(sanitizeCraExportFilenamePart("MALT / OCTO"), "MALT-OCTO");
    assert.equal(craExportCsvFilename("juin 2026"), "cra-juin-2026-tous-porteurs.csv");
    assert.equal(craExportCsvFilename("juin 2026", "Malt"), "cra-juin-2026-Malt.csv");
  });
});

describe("defaultCraExportColumnVisibility", () => {
  it("désactive les colonnes internes par défaut", () => {
    const vis = defaultCraExportColumnVisibility();
    assert.equal(vis.portage, true);
    assert.equal(vis.produit, false);
    assert.equal(vis.mission, false);
    assert.equal(vis.equipe, false);
    assert.equal(vis.periode, false);
  });
});
