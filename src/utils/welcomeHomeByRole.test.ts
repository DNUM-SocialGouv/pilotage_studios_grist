import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PAGE_ACCESS_ALL_OPEN,
  PAGE_ACCESS_FAIL_CLOSED,
  type PageAccessFlags,
} from "../security/pageAccess.ts";
import {
  buildWelcomeHome,
  welcomeAccessFromSession,
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

describe("buildWelcomeHome", () => {
  it("Freelance : Mon carnet · Missions · Règles (pas Budget)", () => {
    const content = buildWelcomeHome({
      role: "Freelance",
      status: "ok",
      access: welcomeAccessFromSession({
        role: "Freelance",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
      }),
    });
    assert.equal(content.kind, "freelance");
    assert.deepEqual(
      content.ctas.map((c) => c.id),
      ["mon_carnet", "missions", "regles_metier"],
    );
    assert.ok(!content.ctas.some((c) => c.id === "bdc"));
    assert.ok(content.hint?.includes("Budget"));
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

  it("Responsable : Revue si département · Mon carnet · Missions", () => {
    const withDept = buildWelcomeHome({
      role: "Responsable de département",
      status: "ok",
      equipeLabel: "Design",
      access: welcomeAccessFromSession({
        role: "Responsable de département",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        equipeLabel: "Design",
      }),
    });
    assert.equal(withDept.kind, "responsable");
    assert.deepEqual(
      withDept.ctas.map((c) => c.id),
      ["revue_cra", "mon_carnet", "missions"],
    );
    assert.ok(withDept.hint?.includes("Design"));

    const noDept = buildWelcomeHome({
      role: "Responsable de département",
      status: "ok",
      equipeLabel: null,
      access: welcomeAccessFromSession({
        role: "Responsable de département",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        equipeLabel: null,
      }),
    });
    assert.deepEqual(
      noDept.ctas.map((c) => c.id),
      ["mon_carnet", "missions"],
    );
  });

  it("Admin : Missions · BDC · Droits ; Feuille de route seulement si opt-in", () => {
    const withoutRoadmap = buildWelcomeHome({
      role: "Admin",
      status: "ok",
      access: welcomeAccessFromSession({
        role: "Admin",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        includeFeuilleDeRoute: false,
      }),
    });
    assert.equal(withoutRoadmap.kind, "admin");
    assert.deepEqual(
      withoutRoadmap.ctas.map((c) => c.id),
      ["missions", "bdc", "droits_pages"],
    );

    const withRoadmap = buildWelcomeHome({
      role: "Admin",
      status: "ok",
      access: welcomeAccessFromSession({
        role: "Admin",
        status: "ok",
        flags: PAGE_ACCESS_ALL_OPEN,
        includeFeuilleDeRoute: true,
      }),
    });
    assert.deepEqual(
      withRoadmap.ctas.map((c) => c.id),
      ["missions", "bdc", "droits_pages", "feuille_de_route"],
    );
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

  it("standalone sans rôle → aperçu Admin ouvert", () => {
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
    assert.ok(content.ctas.some((c) => c.id === "droits_pages"));
  });
});
