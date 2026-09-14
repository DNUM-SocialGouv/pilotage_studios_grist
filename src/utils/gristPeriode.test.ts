import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  collectPeriodeMonthKeys,
  formatGristPeriodeMonthKeyLabel,
  suiviInPeriodeRange,
} from "./gristPeriode.ts";

/** 1er juin 2026 UTC en secondes Grist. */
const JUIN_2026 = Math.floor(Date.UTC(2026, 5, 1) / 1000);
/** 1er août 2026 UTC. */
const AOUT_2026 = Math.floor(Date.UTC(2026, 7, 1) / 1000);
/** 1er mars 2026 UTC. */
const MARS_2026 = Math.floor(Date.UTC(2026, 2, 1) / 1000);

describe("suiviInPeriodeRange", () => {
  it("sans bornes : accepte toutes les lignes y compris sans période", () => {
    assert.equal(suiviInPeriodeRange({ Periode: JUIN_2026 }, "", ""), true);
    assert.equal(suiviInPeriodeRange({}, "", ""), true);
  });

  it("plage fermée inclusive", () => {
    assert.equal(suiviInPeriodeRange({ Periode: JUIN_2026 }, "2026-06", "2026-08"), true);
    assert.equal(suiviInPeriodeRange({ Periode: AOUT_2026 }, "2026-06", "2026-08"), true);
    assert.equal(suiviInPeriodeRange({ Periode: MARS_2026 }, "2026-06", "2026-08"), false);
  });

  it("borne début seule", () => {
    assert.equal(suiviInPeriodeRange({ Periode: JUIN_2026 }, "2026-06", ""), true);
    assert.equal(suiviInPeriodeRange({ Periode: MARS_2026 }, "2026-06", ""), false);
  });

  it("borne fin seule", () => {
    assert.equal(suiviInPeriodeRange({ Periode: JUIN_2026 }, "", "2026-06"), true);
    assert.equal(suiviInPeriodeRange({ Periode: AOUT_2026 }, "", "2026-06"), false);
  });

  it("exclut une ligne sans période si filtre actif", () => {
    assert.equal(suiviInPeriodeRange({}, "2026-01", ""), false);
    assert.equal(suiviInPeriodeRange({ Periode: "invalide" }, "", "2026-12"), false);
  });

  it("résout Annee / Mois en secours", () => {
    assert.equal(
      suiviInPeriodeRange({ Annee: "2026", Mois: "juin" }, "2026-06", "2026-06"),
      true,
    );
  });
});

describe("collectPeriodeMonthKeys", () => {
  it("collecte et trie les mois sans doublon, ignore sans période", () => {
    assert.deepEqual(
      collectPeriodeMonthKeys([
        { Periode: AOUT_2026 },
        { Periode: JUIN_2026 },
        { Periode: JUIN_2026 },
        {},
        { Periode: MARS_2026 },
      ]),
      ["2026-03", "2026-06", "2026-08"],
    );
  });
});

describe("formatGristPeriodeMonthKeyLabel", () => {
  it("affiche le mois en français", () => {
    assert.match(formatGristPeriodeMonthKeyLabel("2026-06"), /juin 2026/i);
  });
});
