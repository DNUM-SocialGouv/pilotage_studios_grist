import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMembreEquipeRefList,
  weeklyAgendaTraiteLeTimestamp,
} from "./weeklyGristWrite.ts";

describe("buildMembreEquipeRefList", () => {
  it("construit une RefList Grist et déduplique", () => {
    assert.deepEqual(buildMembreEquipeRefList([93, 98, 93]), ["L", 93, 98]);
  });

  it("ignore ids invalides et renvoie null si vide", () => {
    assert.equal(buildMembreEquipeRefList([]), null);
    assert.equal(buildMembreEquipeRefList([0, -1, Number.NaN]), null);
    assert.deepEqual(buildMembreEquipeRefList([46]), ["L", 46]);
  });
});

describe("weeklyAgendaTraiteLeTimestamp", () => {
  it("aligne sur le jour calendaire (Date Grist)", () => {
    const a = weeklyAgendaTraiteLeTimestamp(new Date(2026, 9, 8, 9, 0, 0));
    const b = weeklyAgendaTraiteLeTimestamp(new Date(2026, 9, 8, 23, 59, 0));
    assert.equal(a, b);
  });
});
