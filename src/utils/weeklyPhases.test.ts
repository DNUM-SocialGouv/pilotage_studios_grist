import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Mission, MissionEnfant, WeeklyPhaseRow } from "../types.ts";
import {
  buildWeeklyCards,
  groupCardsByPhase,
  normalizeWeeklyMeteo,
  resolveWeeklyPhase,
  weeklyMeteoIconClass,
  weeklyMeteoTone,
} from "./weeklyPhases.ts";

describe("resolveWeeklyPhase", () => {
  it("utilise la phase satellite si présente", () => {
    const map = new Map([[1, "cadrage" as const]]);
    assert.equal(resolveWeeklyPhase({ id: 1 }, map), "cadrage");
  });

  it("place Statut Terminé en autonomie sans ligne satellite", () => {
    assert.equal(
      resolveWeeklyPhase({ id: 2, Statut: "Terminé" }, new Map()),
      "autonomie",
    );
  });

  it("défaut prochainement", () => {
    assert.equal(
      resolveWeeklyPhase({ id: 3, Statut: "En cours" }, new Map()),
      "prochainement",
    );
  });
});

describe("buildWeeklyCards", () => {
  const missions: Mission[] = [
    { id: 10, Nom_de_la_mission: "Alpha", Statut: "En cours" },
    { id: 11, Nom_de_la_mission: "Beta", Statut: "Terminé" },
  ];
  const enfants: MissionEnfant[] = [
    { id: 1, Mission: 10, Intervenant: 5, Libelle: "Presta A" },
  ];
  const phases: WeeklyPhaseRow[] = [
    {
      id: 100,
      Mission: 10,
      Phase: "actif",
      Meteo: "Au vert",
      Note_ops: "Point budget",
      Membre_equipe: 5,
    },
  ];

  it("joint phase satellite et intervenants", () => {
    const cards = buildWeeklyCards({
      missions,
      missionEnfants: enfants,
      intervenants: [{ id: 5, Prenom_Nom: "Alice", Avatar: "seed-alice" }],
      produits: [],
      phaseRows: phases,
    });
    assert.equal(cards.length, 2);
    const alpha = cards.find((c) => c.missionId === 10);
    const beta = cards.find((c) => c.missionId === 11);
    assert.ok(alpha);
    assert.equal(alpha.phase, "actif");
    assert.equal(alpha.phaseRowId, 100);
    assert.deepEqual(alpha.intervenants, ["Alice"]);
    assert.equal(alpha.meteo, "Au vert");
    assert.equal(alpha.noteOps, "Point budget");
    assert.equal(alpha.membreEquipeId, 5);
    assert.equal(alpha.membreEquipeLabel, "Alice");
    assert.equal(alpha.membreEquipeAvatar, "seed-alice");
    assert.ok(beta);
    assert.equal(beta.phase, "autonomie");
    assert.equal(beta.phaseRowId, null);
    assert.equal(beta.membreEquipeAvatar, "");
  });

  it("normalise anciens libellés Calme/Nuageux/Orageux", () => {
    assert.equal(normalizeWeeklyMeteo("Calme"), "Au vert");
    assert.equal(normalizeWeeklyMeteo("Nuageux"), "À surveiller");
    assert.equal(normalizeWeeklyMeteo("Orageux"), "En difficulté");
    assert.equal(normalizeWeeklyMeteo("Au vert"), "Au vert");
    assert.equal(weeklyMeteoIconClass("Calme"), "fr-icon-sun-line");
    assert.equal(weeklyMeteoIconClass("En difficulté"), "fr-icon-thunderstorms-line");
    assert.equal(weeklyMeteoTone("Au vert"), "vert");
    assert.equal(weeklyMeteoTone("À surveiller"), "surveiller");
    assert.equal(weeklyMeteoTone("En difficulté"), "difficulte");
    assert.equal(weeklyMeteoTone(""), null);
  });

  it("groupe par phase", () => {
    const cards = buildWeeklyCards({
      missions,
      missionEnfants: enfants,
      intervenants: [{ id: 5, Prenom_Nom: "Alice" }],
      produits: [],
      phaseRows: phases,
    });
    const g = groupCardsByPhase(cards);
    assert.equal(g.actif.length, 1);
    assert.equal(g.autonomie.length, 1);
    assert.equal(g.prochainement.length, 0);
  });

  it("en cas de doublons Weekly_phase, garde le plus petit id", () => {
    const cards = buildWeeklyCards({
      missions,
      missionEnfants: enfants,
      intervenants: [{ id: 5, Prenom_Nom: "Alice" }],
      produits: [],
      phaseRows: [
        { id: 200, Mission: 10, Phase: "cadrage" },
        { id: 100, Mission: 10, Phase: "actif" },
      ],
    });
    const alpha = cards.find((c) => c.missionId === 10);
    assert.ok(alpha);
    assert.equal(alpha.phaseRowId, 100);
    assert.equal(alpha.phase, "actif");
  });
});
