import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractGristReferenceIds, suiviRowLinksToBdc } from "./gristReferences.ts";

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

describe("extractGristReferenceIds", () => {
  it("lit un id, une RefList et ignore 0", () => {
    assert.deepEqual(extractGristReferenceIds(7), [7]);
    assert.deepEqual(extractGristReferenceIds(["L", 1, 2, 1]), [1, 2]);
    assert.deepEqual(extractGristReferenceIds(["R", "Equipe", 4]), [4]);
  });
});
