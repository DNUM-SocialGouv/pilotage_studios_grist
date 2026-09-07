import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { libelleProduitGrist } from "./pilotageProduits.ts";

describe("libelleProduitGrist", () => {
  it("lit la colonne Produit du catalogue SDPC", () => {
    assert.equal(libelleProduitGrist({ Produit: "BASAVI" }, 26), "BASAVI");
    assert.equal(
      libelleProduitGrist({ Produit: "Transformation DNUM" }, 430),
      "Transformation DNUM",
    );
  });

  it("retombe sur Produit #id si aucun libellé", () => {
    assert.equal(libelleProduitGrist({}, 26), "Produit #26");
  });
});
