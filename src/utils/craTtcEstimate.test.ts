import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CRA_TTC_COMBINED_FACTOR,
  estimateCraTtc,
  formatMarkupPercent,
  formatTvaPercent,
} from "./craTtcEstimate.ts";

describe("estimateCraTtc", () => {
  it("reproduit Calcul_TTC Malt (jours × TJM × 1,38)", () => {
    const e = estimateCraTtc(2.25, 600);
    assert.ok(e);
    assert.equal(e.htSansMarkup, 1350);
    assert.ok(Math.abs(e.htAvecMarkup - 1552.5) < 1e-9);
    assert.ok(Math.abs(e.ttc - 1863) < 1e-9);
    assert.equal(CRA_TTC_COMBINED_FACTOR, 1.38);
  });

  it("retourne null sans TJM", () => {
    assert.equal(estimateCraTtc(2, 0), null);
    assert.equal(estimateCraTtc(2, Number.NaN), null);
  });
});

describe("formatMarkupPercent / formatTvaPercent", () => {
  it("affiche 15 % et 20 %", () => {
    assert.equal(formatMarkupPercent(), "15 %");
    assert.equal(formatTvaPercent(), "20 %");
  });
});
