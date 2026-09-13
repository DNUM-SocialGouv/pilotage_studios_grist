import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRetoursFields } from "./createRetoursRecord.ts";
import { feedbackAuteurOptionsFromEquipeTable } from "./feedbackEquipe.ts";
import { pageOptionFromPathname } from "./feedbackPages.ts";
import {
  assertWritableTableId,
  isWritableTableId,
} from "../security/writeTableAllowlist.ts";
import type { GristFetchTableResult } from "../gristTypes.ts";

describe("writeTableAllowlist", () => {
  it("autorise uniquement Retours", () => {
    assert.equal(isWritableTableId("Retours"), true);
    assert.equal(isWritableTableId("Feedback_Identite"), false);
    assert.equal(isWritableTableId("BDC"), false);
    assert.throws(() => assertWritableTableId("Plan_activite"), /non autorisée/);
  });
});

describe("feedbackAuteurOptionsFromEquipeTable", () => {
  it("mappe Prenom_Nom / E_mail et ignore les noms vides", () => {
    const table = {
      id: [2, 1, 3],
      Prenom_Nom: ["Zoé", "Alice", ""],
      E_mail: ["z@example.com", "a@example.com", "x@example.com"],
    } as GristFetchTableResult;
    const options = feedbackAuteurOptionsFromEquipeTable(table);
    assert.equal(options.length, 2);
    assert.equal(options[0]?.name, "Alice");
    assert.equal(options[0]?.value, "1");
    assert.equal(options[1]?.label, "Zoé (z@example.com)");
  });
});

describe("buildRetoursFields", () => {
  it("exige un message non vide", () => {
    assert.throws(
      () =>
        buildRetoursFields({
          userName: "A",
          userEmail: "a@b.c",
          type: "Suggestion",
          page: "Accueil",
          message: "  ",
          niveau: "",
          joinContext: false,
        }),
      /Message obligatoire/,
    );
  });

  it("exige un auteur non vide", () => {
    assert.throws(
      () =>
        buildRetoursFields({
          userName: "  ",
          userEmail: "a@b.c",
          type: "Suggestion",
          page: "Accueil",
          message: "ok",
          niveau: "",
          joinContext: false,
        }),
      /Auteur obligatoire/,
    );
  });

  it("pose Statut Nouveau et niveau seulement pour Anomalie", () => {
    const fields = buildRetoursFields({
      userName: "Camille",
      userEmail: "c@example.com",
      type: "Anomalie",
      page: "Missions",
      message: "Bug",
      niveau: "Bloquant — je ne peux pas continuer",
      joinContext: true,
      href: "https://example.test/",
      userAgent: "TestUA",
      screenWidth: 100,
      screenHeight: 50,
      now: new Date("2026-09-12T10:00:00.000Z"),
    });
    assert.equal(fields.Statut, "Nouveau");
    assert.equal(fields.Auteur, "Camille");
    assert.equal(fields.Niveau_gene, "Bloquant — je ne peux pas continuer");
    assert.equal(fields.Date, "2026-09-12T10:00:00.000Z");
    assert.match(fields.Contexte_technique, /TestUA/);
    assert.match(fields.Contexte_technique, /100x50/);
  });

  it("vide Niveau_gene et contexte si non applicable", () => {
    const fields = buildRetoursFields({
      userName: "Camille",
      userEmail: "",
      type: "Question",
      page: "Accueil",
      message: "Comment faire ?",
      niveau: "Mineur — cosmétique / confort",
      joinContext: false,
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    assert.equal(fields.Niveau_gene, "");
    assert.equal(fields.Contexte_technique, "");
    assert.equal(fields.Type, "Question");
  });
});

describe("pageOptionFromPathname", () => {
  it("préremplit selon la route", () => {
    assert.equal(pageOptionFromPathname("/"), "Accueil");
    assert.equal(pageOptionFromPathname("/pa/12"), "Plans d’activité");
    assert.equal(pageOptionFromPathname("/bdc"), "Bons de commande");
    assert.equal(pageOptionFromPathname("/missions/3"), "Missions");
    assert.equal(pageOptionFromPathname("/inconnu"), "Autre");
  });
});
