import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertKanbanColumnId,
  filterFeedbackColumn,
  formatKanbanDate,
  groupProductByKanban,
  isKanbanColumnId,
  KANBAN_PRODUCT_COLUMNS,
  kanbanTicketFromRecord,
  parseGuideSteps,
  parseKanbanColumn,
  prenomFromAuteur,
} from "./kanbanTickets.ts";
import { buildKanbanColonnePatch, updateKanbanColonne } from "./updateKanbanColonne.ts";

describe("parseKanbanColumn / isKanbanColumnId", () => {
  it("normalise et valide l’enum", () => {
    assert.equal(parseKanbanColumn("backlog"), "backlog");
    assert.equal(parseKanbanColumn("en_cours"), "en_cours");
    assert.equal(parseKanbanColumn("livre"), "livre");
    assert.equal(isKanbanColumnId("feedback"), true);
    assert.equal(isKanbanColumnId("nope"), false);
    assert.throws(() => assertKanbanColumnId("nope"), /invalide/);
  });
});

describe("parseGuideSteps", () => {
  it("découpe une ligne = une étape", () => {
    assert.deepEqual(parseGuideSteps("A\nB\n\nC"), ["A", "B", "C"]);
  });
});

describe("formatKanbanDate", () => {
  it("formate un timestamp Unix (secondes)", () => {
    const label = formatKanbanDate(1_700_000_000);
    assert.ok(label.length > 0);
  });

  it("vide si invalide", () => {
    assert.equal(formatKanbanDate(null), "");
    assert.equal(formatKanbanDate(""), "");
  });
});

describe("prenomFromAuteur", () => {
  it("prend le premier mot (Prénom Nom)", () => {
    assert.equal(prenomFromAuteur("Alice Mathieu"), "Alice");
  });

  it("prend le dernier mot si NOM en majuscules", () => {
    assert.equal(prenomFromAuteur("TOUMSY Olivier"), "Olivier");
  });

  it("gère un seul mot", () => {
    assert.equal(prenomFromAuteur("Alice"), "Alice");
  });
});

describe("kanbanTicketFromRecord / grouping", () => {
  it("mappe les champs Grist Produit", () => {
    const item = kanbanTicketFromRecord({
      id: 10,
      Nature: "Produit",
      Cle: "consulter-pa",
      Titre: "Consulter un PA",
      Resume: "Résumé",
      Theme: "Consulter",
      Colonne_kanban: "livre",
      Statut_produit: "done",
      Guide_lead: "Lead",
      Guide_intro: "Intro",
      Guide_etapes: "Étape 1\nÉtape 2",
      Page_path: "/pa",
      Page_lien_libelle: "Ouvrir",
      Lien_github: "https://example.com/1",
      Ordre: 3,
    });
    assert.equal(item.cle, "consulter-pa");
    assert.equal(item.column, "livre");
    assert.equal(item.status, "done");
    assert.deepEqual(item.guideSteps, ["Étape 1", "Étape 2"]);
    assert.equal(item.lienGithub, "https://example.com/1");
  });

  it("ordonne Backlog → En cours → Livré et inverse Livré", () => {
    const a = kanbanTicketFromRecord({
      id: 1,
      Nature: "Produit",
      Cle: "a",
      Titre: "A",
      Colonne_kanban: "livre",
      Statut_produit: "done",
      Ordre: 1,
    });
    const b = kanbanTicketFromRecord({
      id: 2,
      Nature: "Produit",
      Cle: "b",
      Titre: "B",
      Colonne_kanban: "livre",
      Statut_produit: "done",
      Ordre: 2,
    });
    const c = kanbanTicketFromRecord({
      id: 3,
      Nature: "Produit",
      Cle: "c",
      Titre: "C",
      Colonne_kanban: "backlog",
      Statut_produit: "later",
      Ordre: 1,
    });
    const groups = groupProductByKanban([a, b, c]);
    assert.deepEqual(
      groups.map((g) => g.column.id),
      KANBAN_PRODUCT_COLUMNS.map((col) => col.id),
    );
    const livre = groups.find((g) => g.column.id === "livre");
    assert.ok(livre);
    assert.deepEqual(
      livre.items.map((i) => i.cle),
      ["b", "a"],
    );
  });

  it("filtre la colonne Feedback", () => {
    const fb = kanbanTicketFromRecord({
      id: 1,
      Nature: "Feedback",
      Colonne_kanban: "feedback",
      Type: "Anomalie",
      Message: "Hello",
    });
    const moved = kanbanTicketFromRecord({
      id: 2,
      Nature: "Feedback",
      Colonne_kanban: "livre",
      Type: "Anomalie",
      Message: "Done",
    });
    assert.equal(filterFeedbackColumn([fb, moved]).length, 1);
  });
});

describe("buildKanbanColonnePatch", () => {
  it("sync Statut_produit et Statut feedback", () => {
    assert.deepEqual(buildKanbanColonnePatch("livre", "Feedback"), {
      Colonne_kanban: "livre",
      Statut_produit: "done",
      Statut: "Fait",
    });
  });

  it("refuse une colonne hors enum", () => {
    assert.throws(
      () => buildKanbanColonnePatch("nope" as "backlog", "Produit"),
      /invalide/,
    );
  });
});

describe("updateKanbanColonne garde Admin", () => {
  it("refuse sans isAdmin", async () => {
    await assert.rejects(
      () =>
        updateKanbanColonne(1, "backlog", "Produit", { isAdmin: false }),
      /réservé aux Admin/i,
    );
  });
});
