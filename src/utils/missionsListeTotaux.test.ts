import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MissionEnfant } from "../types.ts";
import {
  formatCraJours,
  formatCraMontant,
  samePersonLabel,
  totauxCraDuLot,
} from "./missionsListeTotaux.ts";

describe("samePersonLabel", () => {
  it("ignore casse et espaces", () => {
    assert.equal(samePersonLabel("Sophie Drouvroy", " sophie drouvroy "), true);
  });

  it("refuse un vide ou un tiret vs un nom", () => {
    assert.equal(samePersonLabel("—", "Sophie Drouvroy"), false);
    assert.equal(samePersonLabel(undefined, "Sophie"), false);
  });
});

describe("formatCraJours / formatCraMontant", () => {
  it("affiche — s’il n’y a aucune ligne CRA", () => {
    assert.equal(formatCraJours({ jours: 0, ttc: 0, count: 0 }, "ready"), "—");
    assert.equal(formatCraMontant({ jours: 0, ttc: 0, count: 0 }, "ready"), "—");
  });
});

describe("totauxCraDuLot", () => {
  it("somme uniquement les CRA des prestations du lot", () => {
    const enfants = [{ id: 1 }, { id: 2 }] as MissionEnfant[];
    const map = new Map([
      [1, { jours: 1, ttc: 10, count: 1 }],
      [2, { jours: 2, ttc: 20, count: 2 }],
      [99, { jours: 100, ttc: 1000, count: 1 }],
    ]);
    assert.deepEqual(totauxCraDuLot(enfants, map), {
      jours: 3,
      ttc: 30,
      count: 3,
    });
  });
});
