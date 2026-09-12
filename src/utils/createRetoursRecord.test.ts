import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRetoursFields } from "./createRetoursRecord.ts";
import { pageOptionFromPathname } from "./feedbackPages.ts";
import {
  isUsableDisplayName,
  normalizeProfile,
  profileUserUrlFromDocBaseUrl,
} from "./gristUserProfile.ts";
import {
  assertWritableTableId,
  isWritableTableId,
} from "../security/writeTableAllowlist.ts";

describe("writeTableAllowlist", () => {
  it("autorise Retours et Feedback_Identite uniquement", () => {
    assert.equal(isWritableTableId("Retours"), true);
    assert.equal(isWritableTableId("Feedback_Identite"), true);
    assert.equal(isWritableTableId("BDC"), false);
    assert.throws(() => assertWritableTableId("Plan_activite"), /non autorisée/);
  });
});

describe("normalizeProfile / isUsableDisplayName", () => {
  it("rejette Anonymous et anon@getgrist.com", () => {
    assert.equal(isUsableDisplayName("Anonymous"), false);
    assert.equal(normalizeProfile("Anonymous", "x@y.z"), null);
    assert.deepEqual(normalizeProfile("Camille", "anon@getgrist.com"), {
      name: "Camille",
      email: "",
    });
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

  it("omet Auteur/Email si le nom est Anonymous (triggers Grist)", () => {
    const fields = buildRetoursFields({
      userName: "Anonymous",
      userEmail: "anon@getgrist.com",
      type: "Question",
      page: "Accueil",
      message: "Comment faire ?",
      niveau: "",
      joinContext: false,
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    assert.equal(fields.Auteur, undefined);
    assert.equal(fields.Email, undefined);
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

describe("profileUserUrlFromDocBaseUrl", () => {
  it("dérive /api/profile/user depuis le baseUrl doc", () => {
    assert.equal(
      profileUserUrlFromDocBaseUrl("https://grist.example/api/docs/abc123"),
      "https://grist.example/api/profile/user",
    );
    assert.equal(
      profileUserUrlFromDocBaseUrl("https://grist.example/o/org/api/docs/abc123/"),
      "https://grist.example/o/org/api/profile/user",
    );
  });
});
