import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { equipeTagDsfrModifierForLabel } from "./equipeTagColors.ts";

describe("equipeTagDsfrModifierForLabel", () => {
  it("est stable pour un même libellé", () => {
    const a = equipeTagDsfrModifierForLabel("Product");
    const b = equipeTagDsfrModifierForLabel("product");
    assert.equal(a, b);
    assert.ok(a.length > 0);
  });

  it("teinte Product en beige-gris-galet (ISO sœur)", () => {
    assert.equal(equipeTagDsfrModifierForLabel("Product"), "beige-gris-galet");
  });

  it("retombe sur blue-cumulus si vide", () => {
    assert.equal(equipeTagDsfrModifierForLabel(""), "blue-cumulus");
    assert.equal(equipeTagDsfrModifierForLabel("   "), "blue-cumulus");
  });
});
