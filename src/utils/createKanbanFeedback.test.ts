import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildKanbanFeedbackFields,
  clampResume,
  clampTitre,
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
    assert.equal(isWritableTableId("Droits_pages"), false);
    assert.equal(isWritableTableId("Retours"), false);
    assert.equal(isWritableTableId("Roadmap"), false);
    assert.equal(isWritableUpdateTableId("Kanban"), true);
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
  it("exige titre et résumé", () => {
    assert.throws(
      () =>
        buildKanbanFeedbackFields({
          userName: "A",
          userEmail: "a@b.c",
          type: "Suggestion",
          titre: "  ",
          resume: "ok",
          page: "Accueil",
          niveau: "",
          joinContext: false,
        }),
      /Titre obligatoire/,
    );
    assert.throws(
      () =>
        buildKanbanFeedbackFields({
          userName: "A",
          userEmail: "a@b.c",
          type: "Suggestion",
          titre: "Titre",
          resume: "  ",
          page: "Accueil",
          niveau: "",
          joinContext: false,
        }),
      /Résumé obligatoire/,
    );
  });

  it("exige un auteur non vide", () => {
    assert.throws(
      () =>
        buildKanbanFeedbackFields({
          userName: "  ",
          userEmail: "a@b.c",
          type: "Suggestion",
          titre: "Titre",
          resume: "ok",
          page: "Accueil",
          niveau: "",
          joinContext: false,
        }),
      /Auteur obligatoire/,
    );
  });

  it("aligne Titre / Resume / Theme←Page ; Message = détail ou résumé", () => {
    const fields = buildKanbanFeedbackFields({
      userName: "Camille",
      userEmail: "c@example.com",
      type: "Anomalie",
      titre: "Bouton Enregistrer grisé",
      resume: "Je ne peux pas valider mon CRA.",
      message: "Étapes : ouvrir Mon carnet…",
      page: "Missions",
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
    assert.equal(fields.Titre, "Bouton Enregistrer grisé");
    assert.equal(fields.Resume, "Je ne peux pas valider mon CRA.");
    assert.equal(fields.Theme, "Missions");
    assert.equal(fields.Page, "Missions");
    assert.equal(fields.Message, "Étapes : ouvrir Mon carnet…");
    assert.equal(fields.Statut, "Nouveau");
    assert.equal(fields.Niveau_gene, "Bloquant — je ne peux pas continuer");
    assert.match(fields.Contexte_technique, /TestUA/);
  });

  it("sans détail : Message = Resume ; vide Niveau hors Anomalie", () => {
    const fields = buildKanbanFeedbackFields({
      userName: "Camille",
      userEmail: "",
      type: "Question",
      titre: "Où est le BDC ?",
      resume: "Comment rattacher un BDC ?",
      page: "Accueil",
      niveau: "Mineur — cosmétique / confort",
      joinContext: false,
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    assert.equal(fields.Niveau_gene, "");
    assert.equal(fields.Contexte_technique, "");
    assert.equal(fields.Type, "Question");
    assert.equal(fields.Message, "Comment rattacher un BDC ?");
    assert.equal(fields.Theme, "Accueil");
  });
});

describe("clampTitre / clampResume", () => {
  it("tronque proprement", () => {
    assert.equal(clampTitre("  A  B  "), "A B");
    assert.ok(clampResume("x".repeat(250)).endsWith("…"));
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
