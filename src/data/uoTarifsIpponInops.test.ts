import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findUoTarifIpponInops,
  IPPON_INOPS_MARKUP_FACTOR,
  IPPON_INOPS_TTC_FACTOR,
  IPPON_INOPS_TVA_FACTOR,
  prixTtcFromHtIpponInops,
  UO_TARIFS_IPPON_INOPS,
  UO_TARIFS_IPPON_INOPS_META,
} from "./uoTarifsIpponInops.ts";
import { computeChiffrageForPorteur } from "./uoTarifsByPorteur.ts";

describe("IPPON / Inops coefficients TTC", () => {
  it("encode markup × TVA = coefficient TTC (1,263156)", () => {
    assert.equal(IPPON_INOPS_MARKUP_FACTOR, 1.05263);
    assert.equal(IPPON_INOPS_TVA_FACTOR, 1.2);
    assert.equal(IPPON_INOPS_TTC_FACTOR, 1.263156);
    assert.equal(
      IPPON_INOPS_MARKUP_FACTOR * IPPON_INOPS_TVA_FACTOR,
      IPPON_INOPS_TTC_FACTOR,
    );
  });

  it("expose les mêmes facteurs dans la meta (≠ actualisation BPU)", () => {
    assert.equal(UO_TARIFS_IPPON_INOPS_META.actualisation, 1.007);
    assert.equal(UO_TARIFS_IPPON_INOPS_META.markup, IPPON_INOPS_MARKUP_FACTOR);
    assert.equal(UO_TARIFS_IPPON_INOPS_META.tva, IPPON_INOPS_TVA_FACTOR);
    assert.equal(
      UO_TARIFS_IPPON_INOPS_META.coefficientTtc,
      IPPON_INOPS_TTC_FACTOR,
    );
  });

  it("dérive TTC = HT × 1,263156 (arrondi centime)", () => {
    assert.equal(prixTtcFromHtIpponInops(100), 126.32);
    assert.equal(prixTtcFromHtIpponInops(402.8), 508.8);
    assert.equal(prixTtcFromHtIpponInops(20303.64), 25646.66);
  });

  it("aligne chaque PU TTC de la grille sur HT × coefficient", () => {
    for (const row of UO_TARIFS_IPPON_INOPS) {
      assert.equal(
        row.prixTtc,
        prixTtcFromHtIpponInops(row.prixHt),
        `${row.code}: TTC attendu ${prixTtcFromHtIpponInops(row.prixHt)}, obtenu ${row.prixTtc}`,
      );
      // Ancien bug : TTC = HT × 1,20 (TVA seule, sans markup 5 %).
      assert.notEqual(
        row.prixTtc,
        Math.round(row.prixHt * 1.2 * 100) / 100,
        `${row.code}: TTC ne doit plus être HT × TVA seule`,
      );
    }
  });

  it("applique le coefficient au chiffrage devis porteur", () => {
    const tarif = findUoTarifIpponInops("UO L4 - P - 1.1");
    assert.ok(tarif);
    const result = computeChiffrageForPorteur("ippon-inops", [
      { code: "UO L4 - P - 1.1", quantite: 2 },
    ]);
    assert.equal(result.totalHt, Math.round(tarif!.prixHt * 2 * 100) / 100);
    assert.equal(result.totalTtc, Math.round(tarif!.prixTtc * 2 * 100) / 100);
    assert.equal(
      result.totalTtc,
      Math.round(tarif!.prixHt * 2 * IPPON_INOPS_TTC_FACTOR * 100) / 100,
    );
  });
});
