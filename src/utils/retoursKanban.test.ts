import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  badgeClassForRetourType,
  filterRetoursOpenForFeedback,
  formatRetourDate,
  prenomFromAuteur,
  retourKanbanItemFromRecord,
  sortRetoursNewestFirst,
} from "./retoursKanban.ts";

describe("formatRetourDate", () => {
  it("formate un timestamp Unix (secondes)", () => {
    const label = formatRetourDate(1_700_000_000);
    assert.match(label, /2023|2024/);
  });

  it("vide si invalide", () => {
    assert.equal(formatRetourDate(null), "");
    assert.equal(formatRetourDate(""), "");
  });
});

describe("retourKanbanItemFromRecord", () => {
  it("mappe les champs utiles", () => {
    const item = retourKanbanItemFromRecord({
      id: 2,
      Date: 1_700_000_000,
      Auteur: "Alice",
      Type: "Anomalie",
      Page: "Produits",
      Message: "Affichage chelou",
      Statut: "Nouveau",
    });
    assert.equal(item.id, 2);
    assert.equal(item.auteur, "Alice");
    assert.equal(item.type, "Anomalie");
    assert.equal(item.message, "Affichage chelou");
    assert.equal(item.statut, "Nouveau");
  });
});

describe("sortRetoursNewestFirst", () => {
  it("trie par id décroissant", () => {
    const sorted = sortRetoursNewestFirst([
      {
        id: 1,
        dateLabel: "",
        auteur: "a",
        type: "t",
        page: "",
        message: "m1",
        statut: "",
      },
      {
        id: 3,
        dateLabel: "",
        auteur: "b",
        type: "t",
        page: "",
        message: "m3",
        statut: "",
      },
    ]);
    assert.deepEqual(
      sorted.map((r) => r.id),
      [3, 1],
    );
  });
});

describe("filterRetoursOpenForFeedback", () => {
  it("retire Fait / Écarté et garde Nouveau", () => {
    const filtered = filterRetoursOpenForFeedback([
      {
        id: 1,
        dateLabel: "",
        auteur: "a",
        type: "t",
        page: "",
        message: "ouvert",
        statut: "Nouveau",
      },
      {
        id: 4,
        dateLabel: "",
        auteur: "b",
        type: "t",
        page: "",
        message: "filtres",
        statut: "Fait",
      },
      {
        id: 5,
        dateLabel: "",
        auteur: "c",
        type: "t",
        page: "",
        message: "écarté",
        statut: "Écarté",
      },
    ]);
    assert.deepEqual(
      filtered.map((r) => r.id),
      [1],
    );
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

describe("badgeClassForRetourType", () => {
  it("mappe Anomalie / Suggestion / Question", () => {
    assert.equal(badgeClassForRetourType("Anomalie"), "fr-badge--error");
    assert.equal(badgeClassForRetourType("Suggestion"), "fr-badge--info");
    assert.equal(badgeClassForRetourType("Question"), "fr-badge--new");
  });
});
