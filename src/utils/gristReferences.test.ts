import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  asGristChoice,
  extractGristReferenceIds,
  preferLinkedRef,
  suiviRowLinksToBdc,
} from "./gristReferences.ts";

describe("preferLinkedRef", () => {
  it("garde la colonne nouvelle si elle pointe une ligne", () => {
    assert.equal(preferLinkedRef(42, 9), 42);
  });

  it("retombe sur l’ancienne colonne si la nouvelle est vide", () => {
    assert.equal(preferLinkedRef(0, 9), 9);
    assert.equal(preferLinkedRef(null, 3), 3);
  });

  it("renvoie vide si les deux liens sont absents", () => {
    assert.equal(preferLinkedRef(0, 0), undefined);
  });
});

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

describe("asGristChoice", () => {
  it("ignore CENSORED et placeholders ACL", () => {
    assert.equal(asGristChoice("CENSORED"), undefined);
    assert.equal(asGristChoice("..."), undefined);
    assert.equal(asGristChoice("[Pending]"), undefined);
    assert.equal(asGristChoice("Freelance"), "Freelance");
  });
});

describe("extractGristReferenceIds", () => {
  it("lit un id, une RefList et déduplique", () => {
    assert.deepEqual(extractGristReferenceIds(7), [7]);
    assert.deepEqual(extractGristReferenceIds(["L", 1, 2, 1]), [1, 2]);
    assert.deepEqual(extractGristReferenceIds(["R", "Equipe", 4]), [4]);
    assert.deepEqual(extractGristReferenceIds(0), [0]);
  });
});
