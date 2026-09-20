import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isWritableTableId,
  isWritableUpdateTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import { isAllowlistedTableId } from "../security/fetchTableAllowlist.ts";
import { sanitizeDroitsPagesPatchField } from "./droitsPagesGristWrite.ts";
import {
  DROITS_PAGES_THEMES,
  editablePageAccessKeys,
  isAdminRole,
  isCraDeclarerRole,
} from "./droitsPagesThemes.ts";
import { pageOptionFromPathname } from "./feedbackPages.ts";
import {
  filterNavItemsByPageAccess,
  WIDGET_NAV_ITEMS,
  isWidgetNavGroup,
} from "../layout/widgetNavItems.ts";
import { PAGE_ACCESS_FAIL_CLOSED, canAccessHref } from "../security/pageAccess.ts";

describe("Droits_pages allowlists", () => {
  it("autorise lecture et update, pas create", () => {
    assert.equal(isAllowlistedTableId("Droits_pages"), true);
    assert.equal(isWritableUpdateTableId("Droits_pages"), true);
    assert.equal(isWritableTableId("Droits_pages"), false);
    assert.doesNotThrow(() => assertWritableUpdateTableId("Droits_pages"));
  });
});

describe("droitsPagesThemes", () => {
  it("groupe les écrans par thématiques attendues", () => {
    assert.deepEqual(
      DROITS_PAGES_THEMES.map((t) => t.id),
      ["budget", "outils", "missions", "equipe", "a_venir", "accueil"],
    );
    const accueil = DROITS_PAGES_THEMES.find((t) => t.id === "accueil");
    assert.equal(accueil?.screens[0]?.readOnly, true);
    assert.ok(editablePageAccessKeys().includes("Page_equipe"));
    assert.equal(editablePageAccessKeys().includes("Page_accueil"), false);
  });

  it("détecte le rôle Admin", () => {
    assert.equal(isAdminRole("Admin"), true);
    assert.equal(isAdminRole("Freelance"), false);
    assert.equal(isAdminRole(null), false);
  });

  it("détecte les rôles déclaration CRA", () => {
    assert.equal(isCraDeclarerRole("Admin"), true);
    assert.equal(isCraDeclarerRole("Freelance"), true);
    assert.equal(isCraDeclarerRole("Invité"), false);
    assert.equal(isCraDeclarerRole(null), false);
  });
});

describe("sanitizeDroitsPagesPatchField", () => {
  it("n’écrit qu’une case éditable", () => {
    assert.deepEqual(sanitizeDroitsPagesPatchField("Page_equipe", true), {
      Page_equipe: true,
    });
    assert.deepEqual(sanitizeDroitsPagesPatchField("Page_bdc", false), {
      Page_bdc: false,
    });
  });

  it("refuse Accueil et les clés hors thématiques", () => {
    assert.throws(
      () => sanitizeDroitsPagesPatchField("Page_accueil", false),
      /non modifiable/,
    );
  });
});

describe("filterNavItemsByPageAccess adminOnly", () => {
  it("masque Droits des pages si non Admin", () => {
    const filtered = filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, () => true, {
      isAdmin: false,
      canDeclareCra: true,
    });
    const outils = filtered.find(
      (item) => isWidgetNavGroup(item) && item.text === "Outils",
    );
    assert.ok(outils && isWidgetNavGroup(outils));
    assert.equal(
      outils.children.some((c) => c.href === "/outils/droits-pages"),
      false,
    );
  });

  it("montre Droits des pages si Admin", () => {
    const filtered = filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, () => true, {
      isAdmin: true,
      canDeclareCra: true,
    });
    const outils = filtered.find(
      (item) => isWidgetNavGroup(item) && item.text === "Outils",
    );
    assert.ok(outils && isWidgetNavGroup(outils));
    assert.equal(
      outils.children.some((c) => c.href === "/outils/droits-pages"),
      true,
    );
  });

  it("montre Déclarer mon CRA pour Freelance même sans Page_cra", () => {
    const filtered = filterNavItemsByPageAccess(
      WIDGET_NAV_ITEMS,
      (href) => canAccessHref(href, PAGE_ACCESS_FAIL_CLOSED),
      { isAdmin: false, canDeclareCra: true },
    );
    const budget = filtered.find(
      (item) => isWidgetNavGroup(item) && item.text === "Budget",
    );
    assert.ok(budget && isWidgetNavGroup(budget));
    assert.deepEqual(
      budget.children.map((c) => c.href),
      ["/cra/declarer"],
    );
  });

  it("masque Déclarer mon CRA si rôle non autorisé", () => {
    const filtered = filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, () => true, {
      isAdmin: false,
      canDeclareCra: false,
    });
    const budget = filtered.find(
      (item) => isWidgetNavGroup(item) && item.text === "Budget",
    );
    assert.ok(budget && isWidgetNavGroup(budget));
    assert.equal(
      budget.children.some((c) => c.href === "/cra/declarer"),
      false,
    );
  });
});

describe("feedbackPages droits-pages", () => {
  it("mappe la route Admin", () => {
    assert.equal(pageOptionFromPathname("/outils/droits-pages"), "Droits des pages");
  });
});
