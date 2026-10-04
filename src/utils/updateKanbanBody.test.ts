import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildKanbanBodyPatch,
  updateKanbanBody,
} from "./updateKanbanBody.ts";

describe("buildKanbanBodyPatch", () => {
  it("envoie Resume + Message trimés", () => {
    assert.deepEqual(
      buildKanbanBodyPatch({
        resume: "  Phrase courte  ",
        message: "  Détail\navec lignes  ",
      }),
      {
        Resume: "Phrase courte",
        Message: "Détail\navec lignes",
      },
    );
  });

  it("autorise Message vide", () => {
    assert.deepEqual(buildKanbanBodyPatch({ resume: "Seul le résumé" }), {
      Resume: "Seul le résumé",
      Message: "",
    });
  });

  it("refuse un résumé vide", () => {
    assert.throws(() => buildKanbanBodyPatch({ resume: "   " }), /Résumé obligatoire/);
  });
});

describe("updateKanbanBody garde Admin", () => {
  it("refuse sans isAdmin", async () => {
    await assert.rejects(
      () => updateKanbanBody(1, { resume: "x" }, { isAdmin: false }),
      /réservée aux Admin/i,
    );
  });

  it("refuse un id invalide", async () => {
    await assert.rejects(
      () => updateKanbanBody(0, { resume: "x" }, { isAdmin: true }),
      /Identifiant ticket invalide/,
    );
  });
});
