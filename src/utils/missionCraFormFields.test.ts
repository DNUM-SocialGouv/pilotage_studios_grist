import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SuiviMensuel } from "../types.ts";
import {
  findMissionCraMonthCollisionId,
  missionCraMonthOptions,
  parseMissionCraJoursRequired,
  suiviToMissionCraFormValues,
} from "./missionCraFormFields.ts";

function suivi(partial: Partial<SuiviMensuel> & { id: number }): SuiviMensuel {
  return {
    Intervenants: 1,
    Missions: 10,
    Mission_enfant: 100,
    Periode: "2025-06-01",
    Nb_jours: 2,
    Taches_realisees: "Travail",
    ...partial,
  };
}

describe("suiviToMissionCraFormValues", () => {
  it("mappe mois YYYY-MM, jours et tâches", () => {
    // 1er juin 2025 UTC
    const ts = Date.UTC(2025, 5, 1) / 1000;
    const values = suiviToMissionCraFormValues(
      suivi({
        id: 1,
        Periode: ts,
        Nb_jours: 4.5,
        Taches_realisees: "  Design  ",
        BDC_cible: 42,
      }),
    );
    assert.equal(values.monthKey, "2025-06");
    assert.equal(values.nbJours, "4.5");
    assert.equal(values.taches, "Design");
    assert.equal(values.bdcId, "42");
  });
});

describe("missionCraMonthOptions", () => {
  it("ajoute le mois courant s’il sort de la fenêtre ±6", () => {
    const now = new Date(2025, 8, 15); // sept 2025
    const opts = missionCraMonthOptions("2024-01", now);
    assert.ok(opts.some((o) => o.value === "2024-01"));
    assert.equal(opts[0]?.value, "2024-01");
  });

  it("ne duplique pas un mois déjà dans la fenêtre", () => {
    const now = new Date(2025, 8, 15);
    const opts = missionCraMonthOptions("2025-09", now);
    assert.equal(opts.filter((o) => o.value === "2025-09").length, 1);
  });
});

describe("findMissionCraMonthCollisionId", () => {
  const rows: SuiviMensuel[] = [
    suivi({
      id: 5,
      Intervenants: 1,
      Mission_enfant: 100,
      Periode: Date.UTC(2025, 5, 1) / 1000,
    }),
    suivi({
      id: 9,
      Intervenants: 1,
      Mission_enfant: 100,
      Periode: Date.UTC(2025, 6, 1) / 1000,
    }),
  ];

  it("détecte une collision sur un autre mois", () => {
    assert.equal(findMissionCraMonthCollisionId(rows, 1, 100, "2025-07"), 9);
  });

  it("ignore la ligne exclue (édition sans changer de mois)", () => {
    assert.equal(findMissionCraMonthCollisionId(rows, 1, 100, "2025-06", 5), null);
  });

  it("signale collision si édition vers un mois déjà pris", () => {
    assert.equal(findMissionCraMonthCollisionId(rows, 1, 100, "2025-07", 5), 9);
  });

  it("retourne null si mois libre", () => {
    assert.equal(findMissionCraMonthCollisionId(rows, 1, 100, "2025-08"), null);
  });
});

describe("parseMissionCraJoursRequired", () => {
  it("accepte demi-journées", () => {
    assert.equal(parseMissionCraJoursRequired("2,5"), 2.5);
  });

  it("refuse vide", () => {
    assert.throws(() => parseMissionCraJoursRequired("  "), /jours/);
  });
});
