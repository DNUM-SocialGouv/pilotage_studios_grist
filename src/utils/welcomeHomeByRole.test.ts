import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PAGE_ACCESS_ALL_OPEN,
  PAGE_ACCESS_FAIL_CLOSED,
  type PageAccessFlags,
} from "../security/pageAccess.ts";
import {
  buildWelcomeHome,
  firstNameFromDisplayName,
  welcomeAccessFromSession,
  welcomeGreetingTitle,
  welcomeRoleKind,
} from "./welcomeHomeByRole.ts";

function flags(partial: Partial<PageAccessFlags>): PageAccessFlags {
  return { ...PAGE_ACCESS_ALL_OPEN, ...partial };
}

describe("welcomeRoleKind", () => {
  it("mappe les quatre rôles connus", () => {
    assert.equal(welcomeRoleKind("Freelance"), "freelance");
    assert.equal(welcomeRoleKind("Responsable de département"), "responsable");
    assert.equal(welcomeRoleKind("Admin"), "admin");
    assert.equal(welcomeRoleKind("Invité"), "invite");
  });

  it("renvoie unknown pour vide / inconnu", () => {
    assert.equal(welcomeRoleKind(null), "unknown");
    assert.equal(welcomeRoleKind(""), "unknown");
    assert.equal(welcomeRoleKind("Autre"), "unknown");
  });
});

describe("firstNameFromDisplayName / welcomeGreetingTitle", () => {
  it("extrait le prénom (Prénom Nom ou NOM Prénom)", () => {
    assert.equal(firstNameFromDisplayName("Nathalie Molines"), "Nathalie");
    assert.equal(firstNameFromDisplayName("MOLINES Nathalie"), "Nathalie");
    assert.equal(firstNameFromDisplayName("Nathalie"), "Nathalie");
    assert.equal(firstNameFromDisplayName(null), null);
    assert.equal(firstNameFromDisplayName("  "), null);
  });

  it("titre Bonjour [Prénom] ou Bonjour seul", () => {
    assert.equal(welcomeGreetingTitle("Nathalie Molines"), "Bonjour Nathalie");
    assert.equal(welcomeGreetingTitle(null), "Bonjour");
    assert.equal(welcomeGreetingTitle(""), "Bonjour");
  });
});

describe("buildWelcomeHome", () => {
  it("Freelance : titre prénom, CTA sans Budget, hint déclaration seul", () => {
    const content = buildWelcomeHome({
      role: "Freelance",
      status: "ok",
      displayName: "Nathalie Molines",
      access: welcomeAccessFromSession({
        role: "Freelance",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
      }),
    });
    assert.equal(content.kind, "freelance");
    assert.equal(content.title, "Bonjour Nathalie");
    assert.equal(content.roleLabel, null);
    assert.equal(content.lead, null);
    assert.equal(content.showProductLabel, false);
    assert.equal(content.hint, "Pensez à déclarer les jours du mois.");
    assert.ok(!content.hint?.includes("Budget"));
    assert.deepEqual(
      content.ctas.map((c) => c.id),
      ["mon_carnet", "missions", "regles_metier"],
    );
    assert.ok(!content.ctas.some((c) => c.id === "bdc"));
  });

  it("Freelance sans Prenom_Nom : Bonjour seul", () => {
    const content = buildWelcomeHome({
      role: "Freelance",
      status: "ok",
      displayName: null,
      access: welcomeAccessFromSession({
        role: "Freelance",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
      }),
    });
    assert.equal(content.title, "Bonjour");
  });

  it("masque Missions si Page_missions fermé", () => {
    const content = buildWelcomeHome({
      role: "Freelance",
      status: "ok",
      access: welcomeAccessFromSession({
        role: "Freelance",
        status: "ok",
        flags: flags({ Page_missions: false }),
      }),
    });
    assert.deepEqual(
      content.ctas.map((c) => c.id),
      ["mon_carnet", "regles_metier"],
    );
  });

  it("Responsable : titre prénom, sans branding / rôle / lead / À savoir ; CTA selon département", () => {
    const withDept = buildWelcomeHome({
      role: "Responsable de département",
      status: "ok",
      displayName: "Nathalie Molines",
      equipeLabel: "Design",
      access: welcomeAccessFromSession({
        role: "Responsable de département",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        equipeLabel: "Design",
      }),
    });
    assert.equal(withDept.kind, "responsable");
    assert.equal(withDept.title, "Bonjour Nathalie");
    assert.equal(withDept.roleLabel, null);
    assert.equal(withDept.lead, null);
    assert.equal(withDept.hint, null);
    assert.equal(withDept.showProductLabel, false);
    assert.deepEqual(
      withDept.ctas.map((c) => c.id),
      ["revue_cra", "mon_carnet", "missions"],
    );

    const noDept = buildWelcomeHome({
      role: "Responsable de département",
      status: "ok",
      displayName: "MOLINES Nathalie",
      equipeLabel: null,
      access: welcomeAccessFromSession({
        role: "Responsable de département",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        equipeLabel: null,
      }),
    });
    assert.equal(noDept.title, "Bonjour Nathalie");
    assert.equal(noDept.hint, null);
    assert.deepEqual(
      noDept.ctas.map((c) => c.id),
      ["mon_carnet", "missions"],
    );
  });

  it("Responsable sans Prenom_Nom : Bonjour seul", () => {
    const content = buildWelcomeHome({
      role: "Responsable de département",
      status: "ok",
      displayName: null,
      equipeLabel: "Design",
      access: welcomeAccessFromSession({
        role: "Responsable de département",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        equipeLabel: "Design",
      }),
    });
    assert.equal(content.title, "Bonjour");
    assert.equal(content.roleLabel, null);
    assert.equal(content.hint, null);
    assert.equal(content.showProductLabel, false);
  });

  it("Admin : titre prénom, sans branding / rôle / lead / À savoir ; CTA selon opt-in Feuille de route", () => {
    const withoutRoadmap = buildWelcomeHome({
      role: "Admin",
      status: "ok",
      displayName: "Nathalie Molines",
      access: welcomeAccessFromSession({
        role: "Admin",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        includeFeuilleDeRoute: false,
      }),
    });
    assert.equal(withoutRoadmap.kind, "admin");
    assert.equal(withoutRoadmap.title, "Bonjour Nathalie");
    assert.equal(withoutRoadmap.roleLabel, null);
    assert.equal(withoutRoadmap.lead, null);
    assert.equal(withoutRoadmap.hint, null);
    assert.equal(withoutRoadmap.showProductLabel, false);
    assert.deepEqual(
      withoutRoadmap.ctas.map((c) => c.id),
      ["missions", "bdc", "droits_pages"],
    );

    const withRoadmap = buildWelcomeHome({
      role: "Admin",
      status: "ok",
      displayName: "MOLINES Nathalie",
      access: welcomeAccessFromSession({
        role: "Admin",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        includeFeuilleDeRoute: true,
      }),
    });
    assert.equal(withRoadmap.title, "Bonjour Nathalie");
    assert.equal(withRoadmap.hint, null);
    assert.deepEqual(
      withRoadmap.ctas.map((c) => c.id),
      ["missions", "bdc", "droits_pages", "feuille_de_route"],
    );
  });

  it("Admin sans Prenom_Nom : Bonjour seul", () => {
    const content = buildWelcomeHome({
      role: "Admin",
      status: "ok",
      displayName: null,
      access: welcomeAccessFromSession({
        role: "Admin",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        includeFeuilleDeRoute: true,
      }),
    });
    assert.equal(content.title, "Bonjour");
    assert.equal(content.roleLabel, null);
    assert.equal(content.hint, null);
  });

  it("Invité : Missions · Produits · Règles (pas carnet / revue / droits)", () => {
    const content = buildWelcomeHome({
      role: "Invité",
      status: "ok",
      access: welcomeAccessFromSession({
        role: "Invité",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
      }),
    });
    assert.equal(content.kind, "invite");
    assert.deepEqual(
      content.ctas.map((c) => c.id),
      ["missions", "produits", "regles_metier"],
    );
    assert.ok(!content.ctas.some((c) => c.id === "mon_carnet"));
    assert.ok(!content.ctas.some((c) => c.id === "revue_cra"));
    assert.ok(!content.ctas.some((c) => c.id === "droits_pages"));
  });

  it("profil erreur / inconnu : CTA limités fail-closed", () => {
    const content = buildWelcomeHome({
      role: null,
      status: "error",
      access: {
        flags: PAGE_ACCESS_FAIL_CLOSED,
        canDeclareCra: false,
        canRevueCraEquipe: false,
        isAdmin: false,
      },
    });
    assert.equal(content.kind, "unknown");
    assert.deepEqual(
      content.ctas.map((c) => c.id),
      ["regles_metier", "missions"],
    );
  });

  it("standalone sans rôle → aperçu Admin ouvert (même épurage)", () => {
    const content = buildWelcomeHome({
      role: null,
      status: "standalone",
      access: welcomeAccessFromSession({
        role: null,
        status: "standalone",
        flags: PAGE_ACCESS_ALL_OPEN,
      }),
    });
    assert.equal(content.kind, "admin");
    assert.equal(content.title, "Bonjour");
    assert.equal(content.roleLabel, null);
    assert.equal(content.lead, null);
    assert.equal(content.hint, null);
    assert.equal(content.showProductLabel, false);
    assert.ok(content.ctas.some((c) => c.id === "droits_pages"));
  });
});
