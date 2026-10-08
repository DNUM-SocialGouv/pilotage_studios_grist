import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMissionsKanbanColumns,
  columnKeyForMissionStatut,
  groupMissionsByKanbanColumn,
  writeStatusForColumnKey,
} from "./missionsKanban.ts";

describe("columnKeyForMissionStatut", () => {
  it("regroupe Récurrent et Suivi dans En cours", () => {
    assert.equal(columnKeyForMissionStatut("En cours"), "en_cours");
    assert.equal(columnKeyForMissionStatut("Récurrent"), "en_cours");
    assert.equal(
      columnKeyForMissionStatut("Suivi et amélioration continue"),
      "en_cours",
    );
  });

  it("mappe le pipeline et Autre", () => {
    assert.equal(columnKeyForMissionStatut("A instruire"), "a_instruire");
    assert.equal(columnKeyForMissionStatut(""), "autre");
    assert.equal(columnKeyForMissionStatut("Bizarre"), "statut:Bizarre");
  });
});

describe("buildMissionsKanbanColumns", () => {
  it("affiche les 3 colonnes défaut sans terminées", () => {
    const cols = buildMissionsKanbanColumns({
      presentStatuts: ["En cours", "Terminé", "A instruire"],
      statutFilter: [],
      showClosed: false,
    });
    assert.deepEqual(
      cols.map((c) => c.key),
      ["a_instruire", "en_investigation", "en_cours"],
    );
  });

  it("réaffiche Terminé via toggle", () => {
    const cols = buildMissionsKanbanColumns({
      presentStatuts: ["Terminé"],
      statutFilter: [],
      showClosed: true,
    });
    assert.ok(cols.some((c) => c.key === "termine"));
  });

  it("réaffiche Terminé via filtre statut", () => {
    const cols = buildMissionsKanbanColumns({
      presentStatuts: ["Terminé"],
      statutFilter: ["Terminé"],
      showClosed: false,
    });
    assert.ok(cols.some((c) => c.key === "termine"));
  });

  it("ajoute une colonne dédiée pour un statut rare", () => {
    const cols = buildMissionsKanbanColumns({
      presentStatuts: ["En pause"],
      statutFilter: [],
      showClosed: false,
    });
    assert.ok(cols.some((c) => c.key === "statut:En pause"));
  });
});

describe("groupMissionsByKanbanColumn / writeStatus", () => {
  it("place Récurrent dans En cours et écrit En cours au drop", () => {
    const cols = buildMissionsKanbanColumns({
      presentStatuts: ["Récurrent"],
      statutFilter: [],
      showClosed: false,
    });
    const grouped = groupMissionsByKanbanColumn(
      [{ id: 1, Statut: "Récurrent" }],
      cols,
    );
    assert.equal(grouped.get("en_cours")?.length, 1);
    assert.equal(writeStatusForColumnKey("en_cours", cols), "En cours");
  });

  it("masque les cartes Terminé si colonne absente", () => {
    const cols = buildMissionsKanbanColumns({
      presentStatuts: ["Terminé", "En cours"],
      statutFilter: [],
      showClosed: false,
    });
    const grouped = groupMissionsByKanbanColumn(
      [
        { id: 1, Statut: "Terminé" },
        { id: 2, Statut: "En cours" },
      ],
      cols,
    );
    assert.equal(grouped.get("en_cours")?.length, 1);
    assert.equal(grouped.has("termine"), false);
  });
});
