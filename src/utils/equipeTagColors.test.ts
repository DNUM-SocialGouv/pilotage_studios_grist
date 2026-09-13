import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  equipeTagBackgroundVar,
  equipeTagDsfrModifierForLabel,
} from "./equipeTagColors.ts";

describe("equipeTagDsfrModifierForLabel", () => {
  it("mappe les libellés studio sur des familles DSFR distinctes", () => {
    assert.equal(equipeTagDsfrModifierForLabel("Design"), "green-bourgeon");
    assert.equal(equipeTagDsfrModifierForLabel("Product"), "beige-gris-galet");
    assert.equal(equipeTagDsfrModifierForLabel("RU"), "blue-ecume");
    assert.equal(equipeTagDsfrModifierForLabel("Tech"), "purple-glycine");
    assert.equal(equipeTagDsfrModifierForLabel("Access."), "green-menthe");
    assert.equal(equipeTagDsfrModifierForLabel("Coach"), "yellow-moutarde");
    assert.equal(equipeTagDsfrModifierForLabel("Adrien"), "blue-cumulus");
  });

  it("sépare Tech et RU (collision hash historique)", () => {
    assert.notEqual(
      equipeTagDsfrModifierForLabel("Tech"),
      equipeTagDsfrModifierForLabel("RU"),
    );
  });

  it("est insensible à la casse", () => {
    assert.equal(
      equipeTagDsfrModifierForLabel("design"),
      equipeTagDsfrModifierForLabel("Design"),
    );
    assert.equal(
      equipeTagDsfrModifierForLabel("tech"),
      equipeTagDsfrModifierForLabel("Tech"),
    );
  });

  it("retombe sur blue-cumulus si vide", () => {
    assert.equal(equipeTagDsfrModifierForLabel(""), "blue-cumulus");
    assert.equal(equipeTagDsfrModifierForLabel("   "), "blue-cumulus");
  });

  it("expose un token CSS action-low (aligné tags)", () => {
    assert.equal(
      equipeTagBackgroundVar("Design"),
      "var(--background-action-low-green-bourgeon)",
    );
    assert.equal(
      equipeTagBackgroundVar("RU"),
      "var(--background-action-low-blue-ecume)",
    );
  });
});
