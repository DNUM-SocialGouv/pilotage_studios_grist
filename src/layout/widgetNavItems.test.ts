import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WIDGET_MODULE_LINKS,
  WIDGET_NAV_ITEMS,
  flattenNavLinks,
  isGroupActive,
  isNavActive,
  isWidgetNavGroup,
} from "./widgetNavItems.ts";

describe("isNavActive", () => {
  it("Accueil uniquement sur /", () => {
    assert.equal(isNavActive("/", "/"), true);
    assert.equal(isNavActive("/pa", "/"), false);
    assert.equal(isNavActive("/bdc", "/"), false);
  });

  it("matche la liste et les fiches", () => {
    assert.equal(isNavActive("/pa", "/pa"), true);
    assert.equal(isNavActive("/pa/12", "/pa"), true);
    assert.equal(isNavActive("/bdc/3", "/bdc"), true);
    assert.equal(isNavActive("/produits", "/pa"), false);
  });
});

describe("isGroupActive", () => {
  const budget = WIDGET_NAV_ITEMS.find(
    (item) => isWidgetNavGroup(item) && item.text === "Budget",
  );
  assert.ok(budget && isWidgetNavGroup(budget));

  it("est actif sur BDC, PA, CRA, PV (listes et fiches)", () => {
    assert.equal(isGroupActive("/bdc", budget), true);
    assert.equal(isGroupActive("/bdc/9", budget), true);
    assert.equal(isGroupActive("/pa", budget), true);
    assert.equal(isGroupActive("/pa/1", budget), true);
    assert.equal(isGroupActive("/cra", budget), true);
    assert.equal(isGroupActive("/pv", budget), true);
  });

  it("n’est pas actif hors Budget", () => {
    assert.equal(isGroupActive("/", budget), false);
    assert.equal(isGroupActive("/produits", budget), false);
    assert.equal(isGroupActive("/missions", budget), false);
  });
});

describe("flattenNavLinks", () => {
  it("aplatit Accueil, sous-menu Budget et liens directs", () => {
    const hrefs = flattenNavLinks(WIDGET_NAV_ITEMS).map((link) => link.href);
    assert.deepEqual(hrefs, [
      "/",
      "/bdc",
      "/pa",
      "/cra",
      "/pv",
      "/produits",
      "/missions",
      "/intervenants",
    ]);
  });
});

describe("WIDGET_MODULE_LINKS", () => {
  it("liste les 7 modules welcome (hors Accueil)", () => {
    assert.deepEqual(
      WIDGET_MODULE_LINKS.map(({ text, href, status }) => ({ text, href, status })),
      [
        { text: "Bons de commande", href: "/bdc", status: "in_progress" },
        { text: "Plans d’activité", href: "/pa", status: "in_progress" },
        { text: "Prestation / CRA", href: "/cra", status: "coming" },
        { text: "Procès-verbaux", href: "/pv", status: "coming" },
        { text: "Produits", href: "/produits", status: "coming" },
        { text: "Missions", href: "/missions", status: "in_progress" },
        { text: "Intervenants", href: "/intervenants", status: "coming" },
      ],
    );
  });
});
