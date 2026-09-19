import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isWritableTableId,
  isWritableUpdateTableId,
  assertWritableUpdateTableId,
} from "../security/writeTableAllowlist.ts";
import { isAllowlistedTableId } from "../security/fetchTableAllowlist.ts";
import { sanitizeDroitsPagesUpdateFields } from "./droitsPagesGristWrite.ts";
import {
  DROITS_PAGES_THEMES,
  editablePageAccessKeys,
  isAdminRole,
} from "./droitsPagesThemes.ts";
import { pageOptionFromPathname } from "./feedbackPages.ts";
import {
  filterNavItemsByPageAccess,
  WIDGET_NAV_ITEMS,
  isWidgetNavGroup,
} from "../layout/widgetNavItems.ts";

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
});

describe("sanitizeDroitsPagesUpdateFields", () => {
  it("force Page_accueil et ignore les clés inconnues", () => {
    const fields = sanitizeDroitsPagesUpdateFields({
      Page_accueil: false,
      Page_equipe: true,
      Page_bdc: false,
      ...({ Page_inconnue: true } as object),
    } as Partial<import("../security/pageAccess.ts").PageAccessFlags>);
    assert.equal(fields.Page_accueil, true);
    assert.equal(fields.Page_equipe, true);
    assert.equal(fields.Page_bdc, false);
    assert.equal("Page_inconnue" in fields, false);
  });
});

describe("filterNavItemsByPageAccess adminOnly", () => {
  it("masque Droits des pages si non Admin", () => {
    const filtered = filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, () => true, {
      isAdmin: false,
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
});

describe("feedbackPages droits-pages", () => {
  it("mappe la route Admin", () => {
    assert.equal(pageOptionFromPathname("/outils/droits-pages"), "Droits des pages");
  });
});
