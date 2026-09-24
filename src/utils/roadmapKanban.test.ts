import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  groupRoadmapByKanban,
  parseGuideSteps,
  parseRoadmapColumn,
  roadmapTicketFromRecord,
  ROADMAP_KANBAN_COLUMNS,
} from "./roadmapKanban.ts";

describe("parseRoadmapColumn", () => {
  it("normalise les colonnes", () => {
    assert.equal(parseRoadmapColumn("backlog"), "backlog");
    assert.equal(parseRoadmapColumn("en_cours"), "en_cours");
    assert.equal(parseRoadmapColumn("livre"), "livre");
  });
});

describe("parseGuideSteps", () => {
  it("découpe une ligne = une étape", () => {
    assert.deepEqual(parseGuideSteps("A\nB\n\nC"), ["A", "B", "C"]);
  });
});

describe("roadmapTicketFromRecord", () => {
  it("mappe les champs Grist", () => {
    const item = roadmapTicketFromRecord({
      id: 10,
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
});

describe("groupRoadmapByKanban", () => {
  it("ordonne Backlog → En cours → Livré et inverse Livré", () => {
    const groups = groupRoadmapByKanban([
      {
        id: 1,
        cle: "a",
        title: "A",
        summary: "",
        theme: "",
        column: "livre",
        status: "done",
        guideLead: "",
        guideIntro: "",
        guideSteps: [],
        pagePath: "",
        pageLinkLabel: "",
        lienGithub: "",
        ordre: 1,
      },
      {
        id: 2,
        cle: "b",
        title: "B",
        summary: "",
        theme: "",
        column: "livre",
        status: "done",
        guideLead: "",
        guideIntro: "",
        guideSteps: [],
        pagePath: "",
        pageLinkLabel: "",
        lienGithub: "",
        ordre: 2,
      },
      {
        id: 3,
        cle: "c",
        title: "C",
        summary: "",
        theme: "",
        column: "backlog",
        status: "later",
        guideLead: "",
        guideIntro: "",
        guideSteps: [],
        pagePath: "",
        pageLinkLabel: "",
        lienGithub: "",
        ordre: 1,
      },
    ]);
    assert.deepEqual(
      groups.map((g) => g.column.id),
      ROADMAP_KANBAN_COLUMNS.map((c) => c.id),
    );
    const livre = groups.find((g) => g.column.id === "livre");
    assert.ok(livre);
    assert.deepEqual(
      livre.items.map((i) => i.cle),
      ["b", "a"],
    );
  });
});
