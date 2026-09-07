import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { suiviRowLinksToBdc } from "./gristReferences.ts";

describe("suiviRowLinksToBdc", () => {
  it("matche BDC_cible", () => {
    assert.equal(suiviRowLinksToBdc({ BDC_cible: 12 }, 12), true);
    assert.equal(suiviRowLinksToBdc({ BDC_cible: 12 }, 99), false);
  });

  it("matche Bdc_Chorus2 si BDC_cible vide", () => {
    assert.equal(suiviRowLinksToBdc({ Bdc_Chorus2: 12 }, 12), true);
  });

  it("ignore 0 / absent", () => {
    assert.equal(suiviRowLinksToBdc({ BDC_cible: 0, Bdc_Chorus2: 0 }, 12), false);
    assert.equal(suiviRowLinksToBdc({}, 12), false);
  });
});
