import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterNavItemsByPageAccess, WIDGET_NAV_ITEMS } from "../layout/widgetNavItems.ts";
import {
  PAGE_ACCESS_ALL_OPEN,
  PAGE_ACCESS_FAIL_CLOSED,
  asPageAccessBool,
  canAccessHref,
  canAccessPath,
  pageAccessFromRecord,
  pageAccessKeyForPath,
} from "./pageAccess.ts";

describe("asPageAccessBool", () => {
  it("accepte true / 1 / chaînes", () => {
    assert.equal(asPageAccessBool(true), true);
    assert.equal(asPageAccessBool(1), true);
    assert.equal(asPageAccessBool("true"), true);
    assert.equal(asPageAccessBool("Oui"), true);
  });

  it("refuse le reste", () => {
    assert.equal(asPageAccessBool(false), false);
    assert.equal(asPageAccessBool(0), false);
    assert.equal(asPageAccessBool(null), false);
    assert.equal(asPageAccessBool(""), false);
  });
});

describe("pageAccessFromRecord", () => {
  it("fail-closed sans enregistrement", () => {
    assert.deepEqual(pageAccessFromRecord(null), PAGE_ACCESS_FAIL_CLOSED);
  });

  it("lit les drapeaux Admin", () => {
    const flags = pageAccessFromRecord({
      Page_accueil: true,
      Page_bdc: true,
      Page_pa: true,
      Page_cra: true,
      Page_pv: false,
      Page_produits: true,
      Page_missions: true,
      Page_intervenants: true,
      Page_recap_porteurs: false,
    });
    assert.equal(flags.Page_cra, true);
    assert.equal(flags.Page_pv, false);
    assert.equal(flags.Page_recap_porteurs, false);
  });
});

describe("pageAccessKeyForPath / canAccessPath", () => {
  it("mappe les routes métier", () => {
    assert.equal(pageAccessKeyForPath("/"), "Page_accueil");
    assert.equal(pageAccessKeyForPath("/pa/12"), "Page_pa");
    assert.equal(pageAccessKeyForPath("/bdc"), "Page_bdc");
    assert.equal(pageAccessKeyForPath("/cra"), "Page_cra");
    assert.equal(pageAccessKeyForPath("/outils/recap-porteurs"), "Page_recap_porteurs");
    assert.equal(pageAccessKeyForPath("/equipe"), "Page_intervenants");
    assert.equal(pageAccessKeyForPath("/equipe/4"), "Page_intervenants");
    assert.equal(pageAccessKeyForPath("/analyse"), null);
  });

  it("refuse CRA en fail-closed", () => {
    assert.equal(canAccessPath("/cra", PAGE_ACCESS_FAIL_CLOSED), false);
    assert.equal(canAccessPath("/missions", PAGE_ACCESS_FAIL_CLOSED), true);
    assert.equal(canAccessPath("/equipe", PAGE_ACCESS_FAIL_CLOSED), true);
    assert.equal(canAccessPath("/cra", PAGE_ACCESS_ALL_OPEN), true);
  });
});

describe("filterNavItemsByPageAccess", () => {
  it("retire Budget sensible et Outils pour non-Admin", () => {
    const filtered = filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, (href) =>
      canAccessHref(href, PAGE_ACCESS_FAIL_CLOSED),
    );
    const texts = filtered.map((item) => ("children" in item ? item.text : item.text));
    assert.ok(texts.includes("Accueil"));
    assert.ok(texts.includes("Missions"));
    assert.ok(!texts.includes("Budget"));
    assert.ok(!texts.includes("Outils"));
  });

  it("garde Budget si BDC autorisé seul", () => {
    const flags = { ...PAGE_ACCESS_FAIL_CLOSED, Page_bdc: true };
    const filtered = filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, (href) =>
      canAccessHref(href, flags),
    );
    const budget = filtered.find((item) => "children" in item && item.text === "Budget");
    assert.ok(budget && "children" in budget);
    assert.deepEqual(
      budget.children.map((c) => c.href),
      ["/bdc"],
    );
  });
});
