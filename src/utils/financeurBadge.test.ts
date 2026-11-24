import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  financeurBadgeAccent,
  financeurBadgeClass,
} from "./financeurBadge.ts";

describe("financeurBadgeAccent", () => {
  it("mappe les financeurs connus", () => {
    assert.equal(financeurBadgeAccent("DAC - DGCS"), "green-menthe");
    assert.equal(financeurBadgeAccent("DNUM - DD"), "purple-glycine");
    assert.equal(financeurBadgeAccent("DNUM - SIMARS"), "orange-terre-battue");
    assert.equal(financeurBadgeAccent("DGEFP - MISI"), "yellow-moutarde");
  });

  it("est insensible à la casse et aux espaces", () => {
    assert.equal(
      financeurBadgeAccent("  dnum - dd  "),
      financeurBadgeAccent("DNUM - DD"),
    );
  });

  it("reste stable pour un libellé inconnu", () => {
    assert.equal(
      financeurBadgeAccent("Nouveau financeur"),
      financeurBadgeAccent("Nouveau financeur"),
    );
  });

  it("expose la classe fr-badge", () => {
    assert.equal(financeurBadgeClass("DNUM - DD"), "fr-badge--purple-glycine");
  });
});
