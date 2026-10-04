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
  DROITS_PAGES_ROLE_FIXED,
  DROITS_PAGES_THEMES,
  editablePageAccessKeys,
  isAdminRole,
  isCraDeclarerRole,
  isCraRevueEquipeRole,
  isMonCarnetManagerRole,
} from "./droitsPagesThemes.ts";
import { pageOptionFromPathname } from "./feedbackPages.ts";
import {
  filterNavItemsByPageAccess,
  flattenNavLinks,
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
      ["budget", "outils", "missions", "equipe", "produits", "accueil"],
    );
    const produits = DROITS_PAGES_THEMES.find((t) => t.id === "produits");
    assert.equal(produits?.label, "Produits");
    assert.equal(produits?.screens[0]?.key, "Page_produits");
    const accueil = DROITS_PAGES_THEMES.find((t) => t.id === "accueil");
    assert.equal(accueil?.screens[0]?.readOnly, true);
    assert.ok(editablePageAccessKeys().includes("Page_equipe"));
    assert.ok(editablePageAccessKeys().includes("Page_regles_metier"));
    assert.equal(editablePageAccessKeys().includes("Page_accueil"), false);
    const outils = DROITS_PAGES_THEMES.find((t) => t.id === "outils");
    assert.deepEqual(
      outils?.screens.map((s) => s.key),
      ["Page_regles_metier", "Page_recap_porteurs"],
    );
  });

  it("liste les écrans fixés par rôle (lecture seule Admin)", () => {
    assert.deepEqual(
      DROITS_PAGES_ROLE_FIXED.map((s) => s.id),
      ["feuille_de_route", "mon_carnet", "revue_cra", "weekly", "droits_pages"],
    );
    const feuille = DROITS_PAGES_ROLE_FIXED.find(
      (s) => s.id === "feuille_de_route",
    );
    assert.equal(feuille?.accessByRole.Admin, true);
    assert.equal(feuille?.accessByRole.Freelance, true);
    assert.equal(feuille?.accessByRole.Invité, true);
    const carnet = DROITS_PAGES_ROLE_FIXED.find((s) => s.id === "mon_carnet");
    assert.equal(carnet?.accessByRole.Freelance, true);
    assert.equal(carnet?.accessByRole.Invité, false);
    const revue = DROITS_PAGES_ROLE_FIXED.find((s) => s.id === "revue_cra");
    assert.equal(revue?.accessByRole.Freelance, false);
    assert.equal(revue?.accessByRole["Responsable de département"], true);
    const weekly = DROITS_PAGES_ROLE_FIXED.find((s) => s.id === "weekly");
    assert.equal(weekly?.accessByRole.Freelance, false);
    assert.equal(weekly?.accessByRole.Admin, false);
    assert.equal(weekly?.accessByRole.Invité, false);
    const droits = DROITS_PAGES_ROLE_FIXED.find((s) => s.id === "droits_pages");
    assert.equal(droits?.accessByRole.Admin, true);
    assert.equal(droits?.accessByRole.Freelance, false);
  });

  it("détecte le rôle Admin", () => {
    assert.equal(isAdminRole("Admin"), true);
    assert.equal(isAdminRole("Freelance"), false);
    assert.equal(isAdminRole(null), false);
  });

  it("détecte les rôles Mon carnet", () => {
    assert.equal(isCraDeclarerRole("Admin"), true);
    assert.equal(isCraDeclarerRole("Responsable de département"), true);
    assert.equal(isCraDeclarerRole("Freelance"), true);
    assert.equal(isCraDeclarerRole("Invité"), false);
    assert.equal(isCraDeclarerRole(null), false);
  });

  it("détecte le mode manager Mon carnet (liste département)", () => {
    assert.equal(isMonCarnetManagerRole("Admin"), true);
    assert.equal(isMonCarnetManagerRole("Responsable de département"), true);
    assert.equal(isMonCarnetManagerRole("Freelance"), false);
    assert.equal(isMonCarnetManagerRole("Invité"), false);
    assert.equal(isMonCarnetManagerRole(null), false);
  });

  it("détecte les rôles revue CRA équipe", () => {
    assert.equal(isCraRevueEquipeRole("Admin"), true);
    assert.equal(isCraRevueEquipeRole("Responsable de département"), true);
    assert.equal(isCraRevueEquipeRole("Freelance"), false);
    assert.equal(isCraRevueEquipeRole(null), false);
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

  it("ne montre plus Mon carnet en nav (menu compte) ; Weekly oui ; sans Budget pour Freelance", () => {
    const filtered = filterNavItemsByPageAccess(
      WIDGET_NAV_ITEMS,
      (href) => canAccessHref(href, PAGE_ACCESS_FAIL_CLOSED),
      { isAdmin: false, canDeclareCra: true, canWeekly: true, canRevueCraEquipe: false },
    );
    assert.equal(
      filtered.some((item) => isWidgetNavGroup(item) && item.text === "Budget"),
      false,
    );
    assert.equal(
      filtered.some(
        (item) => !isWidgetNavGroup(item) && item.href === "/cra/declarer",
      ),
      false,
    );
    assert.equal(
      filtered.some((item) => !isWidgetNavGroup(item) && item.href === "/weekly"),
      true,
    );
  });

  it("montre Revue CRA équipe pour Resp. même sans Page_cra", () => {
    const filtered = filterNavItemsByPageAccess(
      WIDGET_NAV_ITEMS,
      (href) => canAccessHref(href, PAGE_ACCESS_FAIL_CLOSED),
      { isAdmin: false, canDeclareCra: false, canRevueCraEquipe: true },
    );
    const budget = filtered.find(
      (item) => isWidgetNavGroup(item) && item.text === "Budget",
    );
    assert.ok(budget && isWidgetNavGroup(budget));
    assert.deepEqual(
      budget.children.map((c) => c.href),
      ["/cra/revue-equipe"],
    );
  });

  it("Resp. : pas de Mon carnet en nav ; Revue CRA dans Budget", () => {
    const filtered = filterNavItemsByPageAccess(
      WIDGET_NAV_ITEMS,
      (href) => canAccessHref(href, PAGE_ACCESS_FAIL_CLOSED),
      { isAdmin: false, canDeclareCra: true, canRevueCraEquipe: true },
    );
    assert.equal(
      filtered.some(
        (item) => !isWidgetNavGroup(item) && item.href === "/cra/declarer",
      ),
      false,
    );
    const budget = filtered.find(
      (item) => isWidgetNavGroup(item) && item.text === "Budget",
    );
    assert.ok(budget && isWidgetNavGroup(budget));
    assert.equal(
      budget.children.some((c) => c.href === "/cra/revue-equipe"),
      true,
    );
  });

  it("masque Revue CRA si rôle non autorisé (Mon carnet hors nav)", () => {
    const filtered = filterNavItemsByPageAccess(WIDGET_NAV_ITEMS, () => true, {
      isAdmin: false,
      canDeclareCra: false,
      canRevueCraEquipe: false,
    });
    assert.equal(
      filtered.some(
        (item) => !isWidgetNavGroup(item) && item.href === "/cra/declarer",
      ),
      false,
    );
    const budget = filtered.find(
      (item) => isWidgetNavGroup(item) && item.text === "Budget",
    );
    assert.ok(budget && isWidgetNavGroup(budget));
    assert.equal(
      budget.children.some((c) => c.href === "/cra/revue-equipe"),
      false,
    );
  });
});

describe("feedbackPages droits-pages", () => {
  it("mappe la route Admin", () => {
    assert.equal(pageOptionFromPathname("/outils/droits-pages"), "Droits des pages");
  });

  it("mappe le spike datatable", () => {
    assert.equal(pageOptionFromPathname("/outils/spike-datatable"), "Spike datatable");
  });

  it("mappe le guide Documentation (règles métier)", () => {
    assert.equal(pageOptionFromPathname("/outils/regles-metier"), "Documentation");
    assert.equal(pageOptionFromPathname("/outils/regles-metier/cra"), "Documentation");
  });
});

describe("filterNavItemsByPageAccess documentation hors nav", () => {
  it("n’expose plus Documentation sous Outils (menu compte)", () => {
    const filtered = filterNavItemsByPageAccess(
      WIDGET_NAV_ITEMS,
      (href) => canAccessHref(href, PAGE_ACCESS_FAIL_CLOSED),
      { isAdmin: false, canDeclareCra: true },
    );
    const outils = filtered.find(
      (item) => isWidgetNavGroup(item) && item.text === "Outils",
    );
    // Fail-closed : Récap fermé → Outils peut disparaître (plus de Règles métier).
    if (outils && isWidgetNavGroup(outils)) {
      assert.equal(
        outils.children.some((c) => c.href === "/outils/regles-metier"),
        false,
      );
    }
    assert.equal(
      flattenNavLinks(filtered).some((l) => l.href === "/outils/regles-metier"),
      false,
    );
  });
});
