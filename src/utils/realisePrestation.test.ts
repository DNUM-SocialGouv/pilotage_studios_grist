import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SuiviMensuel } from "../types.ts";
import {
  filterRealiseWithPrestation,
  realiseHasPrestation,
} from "./realisePrestation.ts";

function row(partial: Partial<SuiviMensuel> & { id: number }): SuiviMensuel {
  return { ...partial, id: partial.id } as SuiviMensuel;
}

describe("realiseHasPrestation", () => {
  it("accepte une ref prestation numérique", () => {
    assert.equal(realiseHasPrestation(row({ id: 1, Mission_enfant: 56 })), true);
  });

  it("refuse Prestation / Mission_enfant vide ou 0", () => {
    assert.equal(realiseHasPrestation(row({ id: 2, Mission_enfant: 0 })), false);
    assert.equal(realiseHasPrestation(row({ id: 3 })), false);
    assert.equal(realiseHasPrestation(row({ id: 4, Mission_enfant: null })), false);
  });
});

describe("filterRealiseWithPrestation", () => {
  it("ne garde que les lignes liées à une prestation", () => {
    const rows = [
      row({ id: 1, Mission_enfant: 10, Calcul_TTC: 100 }),
      row({ id: 2, Mission_enfant: 0, Calcul_TTC: 50 }),
      row({ id: 3, Missions: 99, Calcul_TTC: 20 }),
    ];
    const kept = filterRealiseWithPrestation(rows);
    assert.deepEqual(
      kept.map((r) => r.id),
      [1],
    );
  });
});
