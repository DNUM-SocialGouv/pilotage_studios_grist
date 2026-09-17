import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SuiviMensuel } from "../types.ts";
import {
  craTotauxFiltres,
  defaultCraOrder,
  filterCraRows,
  labelBdcCra,
} from "./craList.ts";
import { extractSuiviBdcRowRef } from "./gristReferences.ts";

describe("extractSuiviBdcRowRef", () => {
  it("priorise BDC_cible puis Bdc_Chorus2", () => {
    assert.equal(extractSuiviBdcRowRef({ BDC_cible: 10, Bdc_Chorus2: 20 }), 10);
    assert.equal(extractSuiviBdcRowRef({ Bdc_Chorus2: 20 }), 20);
    assert.equal(extractSuiviBdcRowRef({ BDC_cible: 0, Bdc_Chorus2: 0 }), undefined);
  });
});

describe("filterCraRows", () => {
  const rows: SuiviMensuel[] = [
    {
      id: 1,
      Periode: Math.floor(Date.UTC(2026, 5, 1) / 1000),
      Equipe: "Design",
      Intervenants: 5,
      Produit: 100,
      BDC_cible: 7,
      Nb_jours: 2,
      Calcul_TTC: 200,
    },
    {
      id: 2,
      Periode: Math.floor(Date.UTC(2026, 4, 1) / 1000),
      Equipe: "RU",
      Intervenants: 8,
      Produit: 200,
      Bdc_Chorus2: 9,
      Nb_jours: 1,
      Calcul_TTC: 100,
    },
  ];

  it("filtre par équipe et intervenant", () => {
    const filtered = filterCraRows(rows, {
      periode: "",
      equipe: "Design",
      intervenantId: "5",
      produitId: "",
      bdcId: "",
    });
    assert.deepEqual(
      filtered.map((r) => r.id),
      [1],
    );
  });

  it("filtre par BDC (cible ou chorus)", () => {
    assert.deepEqual(
      filterCraRows(rows, {
        periode: "",
        equipe: "",
        intervenantId: "",
        produitId: "",
        bdcId: "9",
      }).map((r) => r.id),
      [2],
    );
  });
});

describe("defaultCraOrder", () => {
  it("trie période décroissante puis id", () => {
    const a: SuiviMensuel = { id: 1, Periode: Date.UTC(2026, 4, 1) / 1000 };
    const b: SuiviMensuel = { id: 2, Periode: Date.UTC(2026, 5, 1) / 1000 };
    assert.ok(defaultCraOrder(a, b) > 0);
  });
});

describe("craTotauxFiltres / labelBdcCra", () => {
  it("somme jours et TTC", () => {
    const totaux = craTotauxFiltres([
      { id: 1, Nb_jours: 2, Calcul_TTC: 200 },
      { id: 2, Nb_jours: 1, Calcul_TTC: 50 },
    ]);
    assert.deepEqual(totaux, { count: 2, jours: 3, ttc: 250 });
  });

  it("libellé BDC depuis map ou Nom_BdC", () => {
    const map = new Map([[7, "BDC Alpha"]]);
    assert.equal(labelBdcCra({ id: 1, BDC_cible: 7 }, map), "BDC Alpha");
    assert.equal(labelBdcCra({ id: 2, Nom_BdC: "Sans ref" }, map), "Sans ref");
  });
});
