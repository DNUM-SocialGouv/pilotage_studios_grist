import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WEEKLY_ACTION_STATUT,
  buildWeeklyActionCreateFields,
  buildWeeklyActionFaitFields,
  normalizeWeeklyActionStatut,
  weeklyActionFaitLeTimestamp,
} from "./weeklyAction.ts";

describe("normalizeWeeklyActionStatut", () => {
  it("conserve les valeurs Choice Grist (espaces)", () => {
    assert.equal(
      normalizeWeeklyActionStatut("A faire"),
      WEEKLY_ACTION_STATUT.A_FAIRE,
    );
    assert.equal(
      normalizeWeeklyActionStatut("En cours"),
      WEEKLY_ACTION_STATUT.EN_COURS,
    );
  });

  it("accepte variantes et défaut A faire", () => {
    assert.equal(
      normalizeWeeklyActionStatut("à faire"),
      WEEKLY_ACTION_STATUT.A_FAIRE,
    );
    assert.equal(
      normalizeWeeklyActionStatut("en_cours"),
      WEEKLY_ACTION_STATUT.EN_COURS,
    );
    assert.equal(
      normalizeWeeklyActionStatut(""),
      WEEKLY_ACTION_STATUT.A_FAIRE,
    );
    assert.equal(
      normalizeWeeklyActionStatut(null),
      WEEKLY_ACTION_STATUT.A_FAIRE,
    );
    assert.equal(
      normalizeWeeklyActionStatut("Inconnu"),
      WEEKLY_ACTION_STATUT.A_FAIRE,
    );
  });
});

describe("weeklyActionFaitLeTimestamp", () => {
  it("aligne sur le jour calendaire local (Date Grist)", () => {
    const a = weeklyActionFaitLeTimestamp(new Date(2026, 9, 9, 9, 0, 0));
    const b = weeklyActionFaitLeTimestamp(new Date(2026, 9, 9, 23, 59, 0));
    assert.equal(a, b);
    const midnight = new Date(2026, 9, 9);
    assert.equal(a, Math.floor(midnight.getTime() / 1000));
  });
});

describe("buildWeeklyActionFaitFields", () => {
  it("écrit Fait_le au coche et le vide à la décoche", () => {
    const now = new Date(2026, 9, 9, 14, 30, 0);
    assert.deepEqual(buildWeeklyActionFaitFields(true, now), {
      Fait: true,
      Fait_le: weeklyActionFaitLeTimestamp(now),
    });
    assert.deepEqual(buildWeeklyActionFaitFields(false, now), {
      Fait: false,
      Fait_le: null,
    });
  });
});

describe("buildWeeklyActionCreateFields", () => {
  it("pose Weekly_du / Cree_le au jour du create et Statut A faire", () => {
    const now = new Date(2026, 9, 9, 16, 0, 0);
    const fields = buildWeeklyActionCreateFields({
      titre: "  Relancer le devis  ",
      porteurId: 42,
      email: "alice@example.com",
      now,
    });
    const dayTs = weeklyActionFaitLeTimestamp(now);
    assert.equal(fields.Titre, "Relancer le devis");
    assert.equal(fields.Statut, "A faire");
    assert.equal(fields.Porteur, 42);
    assert.equal(fields.Mission, null);
    assert.equal(fields.Weekly_du, dayTs);
    assert.equal(fields.Cree_le, dayTs);
    assert.equal(fields.Fait, false);
    assert.equal(fields.Fait_le, null);
    assert.equal(fields.Email, "alice@example.com");
  });

  it("refuse un titre vide", () => {
    assert.throws(
      () =>
        buildWeeklyActionCreateFields({
          titre: "   ",
          porteurId: null,
        }),
      /titre/i,
    );
  });
});
