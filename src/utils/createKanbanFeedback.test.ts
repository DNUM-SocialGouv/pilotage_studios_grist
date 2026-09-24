import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildKanbanFeedbackFields,
  resumeFromMessage,
} from "./createKanbanFeedback.ts";
import { feedbackAuteurOptionsFromEquipeTable } from "./feedbackEquipe.ts";
import { pageOptionFromPathname } from "./feedbackPages.ts";
import {
  assertWritableTableId,
  assertWritableUpdateTableId,
  isWritableTableId,
  isWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import type { GristFetchTableResult } from "../gristTypes.ts";

describe("writeTableAllowlist", () => {
  it("autorise Kanban create+update, Kanban_commentaires create ; pas Retours/Roadmap", () => {
    assert.equal(isWritableTableId("Kanban"), true);
    assert.equal(isWritableTableId("Kanban_commentaires"), true);
    assert.equal(isWritableTableId("Missions"), true);
    assert.equal(isWritableTableId("Missions_enfants"), true);
    assert.equal(isWritableTableId("Realise"), true);
    assert.equal(isWritableTableId("Acl_profil"), true);
    assert.equal(isWritableTableId("Equipe"), true);
    assert.equal(isWritableTableId("Droits_pages"), false);
    assert.equal(isWritableTableId("Retours"), false);
    assert.equal(isWritableTableId("Roadmap"), false);
    assert.equal(isWritableUpdateTableId("Kanban"), true);
    assert.equal(isWritableUpdateTableId("Equipe"), false);
    assert.equal(isWritableUpdateTableId("Retours"), false);
    assert.throws(() => assertWritableTableId("Plan_activite"), /non autorisée/);
    assert.throws(() => assertWritableUpdateTableId("Retours"), /non autorisée/);
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

  it("ignore un e-mail CENSORED (ACL colonnes)", () => {
    const table = {
      id: [1],
      Prenom_Nom: ["Alice"],
      E_mail: ["CENSORED"],
    } as GristFetchTableResult;
    const options = feedbackAuteurOptionsFromEquipeTable(table);
    assert.deepEqual(options, [{ value: "1", name: "Alice", email: "", label: "Alice" }]);
  });
});

describe("buildKanbanFeedbackFields", () => {
  it("exige un message non vide", () => {
    assert.throws(
      () =>
        buildKanbanFeedbackFields({
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
        buildKanbanFeedbackFields({
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

  it("pose Nature Feedback, colonne feedback, Statut Nouveau", () => {
    const fields = buildKanbanFeedbackFields({
      userName: "Camille",
      userEmail: "c@example.com",
      type: "Anomalie",
      page: "Missions",
      message: "Bug\nsuite",
      niveau: "Bloquant — je ne peux pas continuer",
      joinContext: true,
      href: "https://example.test/",
      userAgent: "TestUA",
      screenWidth: 100,
      screenHeight: 50,
      now: new Date("2026-09-12T10:00:00.000Z"),
    });
    assert.equal(fields.Nature, "Feedback");
    assert.equal(fields.Colonne_kanban, "feedback");
    assert.equal(fields.Titre, "Anomalie");
    assert.equal(fields.Resume, "Bug");
    assert.equal(fields.Statut, "Nouveau");
    assert.equal(fields.Auteur, "Camille");
    assert.equal(fields.Niveau_gene, "Bloquant — je ne peux pas continuer");
    assert.equal(fields.Date, "2026-09-12T10:00:00.000Z");
    assert.match(fields.Contexte_technique, /TestUA/);
  });

  it("vide Niveau_gene et contexte si non applicable", () => {
    const fields = buildKanbanFeedbackFields({
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
    assert.equal(fields.Resume, "Comment faire ?");
  });
});

describe("resumeFromMessage", () => {
  it("prend la première ligne", () => {
    assert.equal(resumeFromMessage("a\nb"), "a");
  });
});

describe("pageOptionFromPathname", () => {
  it("préremplit selon la route", () => {
    assert.equal(pageOptionFromPathname("/"), "Accueil");
    assert.equal(pageOptionFromPathname("/cra/declarer"), "Mon carnet");
    assert.equal(pageOptionFromPathname("/pa/12"), "Plans d’activité");
    assert.equal(pageOptionFromPathname("/bdc"), "Bons de commande");
    assert.equal(pageOptionFromPathname("/missions/3"), "Missions");
    assert.equal(pageOptionFromPathname("/equipe/2"), "Équipe");
    assert.equal(pageOptionFromPathname("/intervenants"), "Équipe");
    assert.equal(pageOptionFromPathname("/cra"), "Prestation / CRA");
    assert.equal(pageOptionFromPathname("/outils/recap-porteurs"), "Récap porteurs");
    assert.equal(pageOptionFromPathname("/outils/droits-pages"), "Droits des pages");
    assert.equal(pageOptionFromPathname("/inconnu"), "Autre");
  });
});
