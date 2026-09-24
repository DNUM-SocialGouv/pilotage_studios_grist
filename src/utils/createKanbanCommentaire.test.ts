import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildKanbanCommentaireFields } from "./createKanbanCommentaire.ts";
import {
  filterCommentairesForTicket,
  kanbanCommentaireFromRecord,
} from "./kanbanCommentaires.ts";
import { isWritableTableId } from "../security/writeTableAllowlist.ts";

describe("Kanban_commentaires write allowlist", () => {
  it("autorise create Kanban_commentaires", () => {
    assert.equal(isWritableTableId("Kanban_commentaires"), true);
  });
});

describe("buildKanbanCommentaireFields", () => {
  it("construit le payload avec Cible_id Kanban", () => {
    const fields = buildKanbanCommentaireFields({
      cibleId: 7,
      userName: "Alice",
      userEmail: "a@example.com",
      message: "  Salut  ",
      now: new Date("2026-09-23T10:00:00.000Z"),
    });
    assert.equal(fields.Cible_type, "Kanban");
    assert.equal(fields.Cible_id, 7);
    assert.equal(fields.Auteur, "Alice");
    assert.equal(fields.Message, "Salut");
    assert.equal(fields.Date, "2026-09-23T10:00:00.000Z");
  });

  it("refuse message vide", () => {
    assert.throws(
      () =>
        buildKanbanCommentaireFields({
          cibleId: 1,
          userName: "Alice",
          userEmail: "",
          message: "   ",
        }),
      /Message obligatoire/,
    );
  });
});

describe("kanbanCommentaireFromRecord", () => {
  it("filtre par Cible_id", () => {
    const a = kanbanCommentaireFromRecord({
      id: 1,
      Cible_type: "Kanban",
      Cible_id: 5,
      Date: 1_700_000_000,
      Auteur: "Alice",
      Message: "Un",
    });
    const b = kanbanCommentaireFromRecord({
      id: 2,
      Cible_type: "Kanban",
      Cible_id: 9,
      Date: 1_700_000_100,
      Auteur: "Bob",
      Message: "Deux",
    });
    assert.ok(a && b);
    const filtered = filterCommentairesForTicket([a, b], 5);
    assert.deepEqual(
      filtered.map((c) => c.id),
      [1],
    );
  });
});
