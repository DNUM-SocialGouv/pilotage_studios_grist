import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { WeeklyActionRow } from "../types.ts";
import {
  WEEKLY_ACTION_STATUT,
  buildWeeklyActionColumnMoveFields,
  buildWeeklyActionCreateFields,
  buildWeeklyActionFaitFields,
  columnKeyForWeeklyAction,
  defaultWeeklyActionDateFin,
  filterWeeklyActionsEnCours,
  groupWeeklyActionsByColumn,
  isWeeklyActionDateFinOverdue,
  matchWeeklyActionPorteurId,
  normalizeWeeklyActionStatut,
  sortWeeklyActionsEnCours,
  toLocalDateInputValue,
  weeklyActionFaitLeTimestamp,
  weeklyActionStatutLabel,
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

  it("accepte Weekly_du explicite sans changer Cree_le", () => {
    const now = new Date(2026, 9, 9, 16, 0, 0);
    const weeklyDu = new Date(2026, 9, 2);
    const fields = buildWeeklyActionCreateFields({
      titre: "Action datée",
      porteurId: null,
      weeklyDu,
      now,
    });
    assert.equal(fields.Weekly_du, weeklyActionFaitLeTimestamp(weeklyDu));
    assert.equal(fields.Cree_le, weeklyActionFaitLeTimestamp(now));
  });
});

describe("filterWeeklyActionsEnCours / sort", () => {
  it("ne garde que Fait=false et trie par date de fin", () => {
    const rows: WeeklyActionRow[] = [
      { id: 3, Titre: "C", Fait: false, Date_fin: 1_800_000_000 },
      { id: 1, Titre: "A", Fait: true, Date_fin: 1_700_000_000 },
      { id: 2, Titre: "B", Fait: false, Date_fin: 1_700_000_000 },
      { id: 4, Titre: "D", Fait: false, Date_fin: null },
    ];
    const open = filterWeeklyActionsEnCours(rows);
    assert.deepEqual(
      open.map((r) => r.id),
      [3, 2, 4],
    );
    assert.deepEqual(
      sortWeeklyActionsEnCours(open).map((r) => r.id),
      [2, 3, 4],
    );
  });
});

describe("columnKeyForWeeklyAction / move fields / group", () => {
  it("mappe Fait + Statut vers les 3 colonnes (variantes espaces)", () => {
    assert.equal(
      columnKeyForWeeklyAction({ Fait: false, Statut: "A faire" }),
      "a_faire",
    );
    assert.equal(
      columnKeyForWeeklyAction({ Fait: false, Statut: "à faire" }),
      "a_faire",
    );
    assert.equal(
      columnKeyForWeeklyAction({ Fait: false, Statut: "En cours" }),
      "en_cours",
    );
    assert.equal(
      columnKeyForWeeklyAction({ Fait: true, Statut: "A faire" }),
      "done",
    );
    assert.equal(
      columnKeyForWeeklyAction({ Fait: true, Statut: "En cours" }),
      "done",
    );
  });

  it("écrit Fait/Fait_le vers Done et Statut hors Done", () => {
    const now = new Date(2026, 9, 9, 14, 0, 0);
    assert.deepEqual(buildWeeklyActionColumnMoveFields("done", now), {
      Fait: true,
      Fait_le: weeklyActionFaitLeTimestamp(now),
    });
    assert.deepEqual(buildWeeklyActionColumnMoveFields("a_faire", now), {
      Fait: false,
      Fait_le: null,
      Statut: "A faire",
    });
    assert.deepEqual(buildWeeklyActionColumnMoveFields("en_cours", now), {
      Fait: false,
      Fait_le: null,
      Statut: "En cours",
    });
  });

  it("groupe toutes les actions y compris Done", () => {
    const rows: WeeklyActionRow[] = [
      { id: 1, Titre: "A", Fait: false, Statut: "A faire", Date_fin: null },
      { id: 2, Titre: "B", Fait: false, Statut: "En cours", Date_fin: null },
      { id: 3, Titre: "C", Fait: true, Statut: "A faire", Date_fin: null },
    ];
    const byCol = groupWeeklyActionsByColumn(rows);
    assert.deepEqual(
      byCol.get("a_faire")?.map((r) => r.id),
      [1],
    );
    assert.deepEqual(
      byCol.get("en_cours")?.map((r) => r.id),
      [2],
    );
    assert.deepEqual(
      byCol.get("done")?.map((r) => r.id),
      [3],
    );
  });
});

describe("weeklyActionStatutLabel / overdue / defaults", () => {
  it("libellé UI À faire", () => {
    assert.equal(weeklyActionStatutLabel("A faire"), "À faire");
    assert.equal(weeklyActionStatutLabel("En cours"), "En cours");
  });

  it("détecte une date de fin dépassée", () => {
    const now = new Date(2026, 9, 9);
    assert.equal(
      isWeeklyActionDateFinOverdue(new Date(2026, 9, 8), now, false),
      true,
    );
    assert.equal(
      isWeeklyActionDateFinOverdue(new Date(2026, 9, 9), now, false),
      false,
    );
    assert.equal(
      isWeeklyActionDateFinOverdue(new Date(2026, 9, 8), now, true),
      false,
    );
  });

  it("date fin défaut +7 jours et match porteur session", () => {
    const now = new Date(2026, 9, 9);
    assert.equal(
      toLocalDateInputValue(defaultWeeklyActionDateFin(now)),
      "2026-10-16",
    );
    assert.equal(
      matchWeeklyActionPorteurId(
        [
          { id: 1, E_mail: "a@example.com" },
          { id: 2, E_mail: "B@Example.com" },
        ],
        "b@example.com",
      ),
      2,
    );
    assert.equal(
      matchWeeklyActionPorteurId([{ id: 1, E_mail: "a@example.com" }], null),
      null,
    );
  });
});
