/**
 * Tests purs — mapping formulaire édition BDC (pas d’API Grist).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BDC } from "../types.ts";
import {
  BDC_UPDATE_FIELD_KEYS,
  bdcToEditFormValues,
  buildBdcUpdateFields,
  buildEquipe2ChoiceList,
  emptyBdcEditForm,
  parseMontantTtc,
  sanitizeBdcUpdateFields,
} from "./bdcFormFields.ts";

describe("bdcFormFields", () => {
  it("emptyBdcEditForm a des défauts sûrs", () => {
    const f = emptyBdcEditForm();
    assert.equal(f.Statut, "En cours");
    assert.deepEqual(f.Equipe2, []);
    assert.equal(f.Montant_TTC, "");
  });

  it("bdcToEditFormValues mappe PA, Equipe2 ChoiceList et montant", () => {
    const bdc: BDC = {
      id: 1,
      Nom_BdC: "  Test BDC  ",
      Statut: "Soldé",
      Montant_TTC: 1200.5,
      Financeur: "DNUM",
      BdC_Chorus: "123",
      Plateforme: "Malt",
      SOFIANE: " https://example.test ",
      PA: 42,
      Equipe2: ["L", "Design", "RU"],
    };
    const v = bdcToEditFormValues(bdc);
    assert.equal(v.Nom_BdC, "Test BDC");
    assert.equal(v.Statut, "Soldé");
    assert.equal(v.Montant_TTC, "1200.5");
    assert.equal(v.PA, "42");
    assert.deepEqual(v.Equipe2, ["Design", "RU"]);
    assert.equal(v.SOFIANE, "https://example.test");
  });

  it("bdcToEditFormValues ignore PA 0", () => {
    const v = bdcToEditFormValues({ id: 2, PA: 0 });
    assert.equal(v.PA, "");
  });

  it("parseMontantTtc accepte virgule et refuse négatif / vide", () => {
    assert.equal(parseMontantTtc("1 234,56"), 1234.56);
    assert.equal(parseMontantTtc("0"), 0);
    assert.equal(parseMontantTtc(""), "invalid");
    assert.equal(parseMontantTtc("-1"), "invalid");
  });

  it("buildEquipe2ChoiceList produit le format L Grist", () => {
    assert.deepEqual(buildEquipe2ChoiceList([" Design ", "RU", "Design"]), [
      "L",
      "Design",
      "RU",
    ]);
    assert.equal(buildEquipe2ChoiceList([]), null);
  });

  it("buildBdcUpdateFields produit le patch allowlisté", () => {
    const fields = buildBdcUpdateFields({
      Nom_BdC: "  Nom  ",
      Statut: "En cours",
      Montant_TTC: "100,5",
      Financeur: "DAC",
      BdC_Chorus: "999",
      PA: "7",
      Equipe2: ["Design"],
      Plateforme: "Malt",
      SOFIANE: "https://sofiane.example",
    });
    assert.deepEqual(Object.keys(fields).sort(), [...BDC_UPDATE_FIELD_KEYS].sort());
    assert.equal(fields.Nom_BdC, "Nom");
    assert.equal(fields.Montant_TTC, 100.5);
    assert.equal(fields.PA, 7);
    assert.deepEqual(fields.Equipe2, ["L", "Design"]);
  });

  it("buildBdcUpdateFields PA vide → 0", () => {
    const fields = buildBdcUpdateFields({
      ...emptyBdcEditForm(),
      Nom_BdC: "X",
      Montant_TTC: "10",
      PA: "",
    });
    assert.equal(fields.PA, 0);
    assert.equal(fields.Equipe2, null);
  });

  it("sanitizeBdcUpdateFields refuse une colonne hors allowlist", () => {
    assert.throws(
      () =>
        sanitizeBdcUpdateFields({
          Nom_BdC: "a",
          Statut: "En cours",
          Montant_TTC: 1,
          Financeur: "",
          BdC_Chorus: "",
          PA: 0,
          Equipe2: null,
          Plateforme: "",
          SOFIANE: "",
          Total_TTC_CRA: 99,
        }),
      /non autorisée/,
    );
  });
});
