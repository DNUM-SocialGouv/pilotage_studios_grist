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

  it("n’utilise pas Chef_de_produit ni Description comme nom", () => {
    assert.equal(
      libelleProduitGrist(
        { Chef_de_produit: "Alice Martin", Description_longue: "Un très long texte métier" },
        26,
      ),
      "Produit #26",
    );
  });
});
