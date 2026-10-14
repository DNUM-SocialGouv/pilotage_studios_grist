import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeDecoupePv,
  countMonthsInPeriod,
  formatDecoupePvMarkdown,
  splitIntegerEqual,
} from "./devisPorteurs/decoupePv.ts";

describe("splitIntegerEqual", () => {
  it("répartit le reste sur les derniers PV", () => {
    assert.deepEqual(splitIntegerEqual(130, 4), [32, 32, 33, 33]);
    assert.deepEqual(splitIntegerEqual(10, 3), [3, 3, 4]);
  });

  it("refuse parts / total non entiers", () => {
    assert.deepEqual(splitIntegerEqual(10, 0), []);
    assert.deepEqual(splitIntegerEqual(10.5, 2), []);
  });
});

describe("countMonthsInPeriod", () => {
  it("compte les mois calendaires inclus", () => {
    assert.equal(countMonthsInPeriod("2026-01-15", "2026-04-01"), 4);
    assert.equal(countMonthsInPeriod("2026-01-01", "2026-01-31"), 1);
    assert.equal(countMonthsInPeriod("", "2026-01-01"), null);
  });
});

describe("computeDecoupePv", () => {
  it("découpe une UO en quantités entières", () => {
    const result = computeDecoupePv({
      nbPv: 2,
      periodeDebut: "2026-01-01",
      periodeFin: "2026-02-28",
      sources: [
        {
          code: "UO L4 - P - 6.1",
          quantite: 10,
          prixUnitaireHt: 100,
          prixUnitaireTtc: 120,
        },
      ],
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.lignes.length, 2);
    assert.equal(result.totalQuantite, 10);
    assert.equal(result.totalHt, 1000);
    assert.ok(formatDecoupePvMarkdown(result).includes("PV 1"));
  });

  it("refuse les demi-UO", () => {
    const result = computeDecoupePv({
      nbPv: 2,
      periodeDebut: "2026-01-01",
      periodeFin: "2026-02-28",
      sources: [
        {
          code: "UO L4 - P - 6.1",
          quantite: 1.5,
          prixUnitaireHt: 100,
          prixUnitaireTtc: 120,
        },
      ],
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.reason, /entières/);
  });
});
