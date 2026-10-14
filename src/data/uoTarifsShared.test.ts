import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeChiffrageForPorteur } from "./uoTarifsByPorteur.ts";
import {
  computeChiffrageLignes,
  formatEuro,
  type UoTarifEntry,
} from "./uoTarifsShared.ts";

const SAMPLE: readonly UoTarifEntry[] = [
  { code: "A", label: "A", kind: "packaged", prixHt: 100, prixTtc: 120 },
  { code: "B", label: "B", kind: "packaged", prixHt: 50, prixTtc: 60 },
];

describe("formatEuro", () => {
  it("formate en euros FR", () => {
    assert.match(formatEuro(1234.5), /1[\s\u202f]?234/);
  });
});

describe("computeChiffrageLignes", () => {
  it("calcule HT/TTC par ligne et total", () => {
    const byCode = new Map(SAMPLE.map((t) => [t.code, t]));
    const result = computeChiffrageLignes(
      (code) => byCode.get(code),
      [
        { code: "A", quantite: 2 },
        { code: "B", quantite: 1 },
      ],
    );
    assert.equal(result.totalHt, 250);
    assert.equal(result.totalTtc, 300);
    assert.equal(result.lignes.length, 2);
  });
});

describe("computeChiffrageForPorteur", () => {
  it("applique la grille Hubvisory pour une UO connue", () => {
    const result = computeChiffrageForPorteur("hubvisory-numercite-opteamis", [
      { code: "UO L4 - P - 6.1", quantite: 1 },
    ]);
    assert.ok(result.lignes.length >= 1);
    assert.ok(result.totalHt > 0);
    assert.ok(result.totalTtc >= result.totalHt);
  });
});
