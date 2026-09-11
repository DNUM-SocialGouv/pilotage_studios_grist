import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  equipeTagBackgroundVar,
  equipeTagDsfrModifierForLabel,
} from "./equipeTagColors.ts";

describe("equipeTagDsfrModifierForLabel", () => {
  it("mappe les libellés studio sur des familles DSFR (modulo unsigned)", () => {
    assert.equal(equipeTagDsfrModifierForLabel("Design"), "green-bourgeon");
    assert.equal(equipeTagDsfrModifierForLabel("Product"), "beige-gris-galet");
    assert.equal(equipeTagDsfrModifierForLabel("RU"), "green-archipel");
    assert.equal(equipeTagDsfrModifierForLabel("Access."), "green-menthe");
    assert.equal(equipeTagDsfrModifierForLabel("Coach"), "purple-glycine");
    assert.equal(equipeTagDsfrModifierForLabel("Adrien"), "blue-ecume");
  });

  it("est insensible à la casse", () => {
    assert.equal(
      equipeTagDsfrModifierForLabel("design"),
      equipeTagDsfrModifierForLabel("Design"),
    );
  });

  it("retombe sur blue-cumulus si vide", () => {
    assert.equal(equipeTagDsfrModifierForLabel(""), "blue-cumulus");
    assert.equal(equipeTagDsfrModifierForLabel("   "), "blue-cumulus");
  });

  it("expose un token CSS action-low", () => {
    assert.equal(
      equipeTagBackgroundVar("Design"),
      "var(--background-action-low-green-bourgeon)",
    );
  });
});
