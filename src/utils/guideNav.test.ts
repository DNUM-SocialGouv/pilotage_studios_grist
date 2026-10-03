import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GUIDE_BASE,
  GUIDE_NAV,
  guideNavIndex,
  guideNavNeighbors,
} from "../pages/regles-metier/guideNav.ts";

describe("guideNav", () => {
  it("indexe l’accueil et les sous-pages", () => {
    assert.equal(guideNavIndex(GUIDE_BASE), 0);
    assert.equal(guideNavIndex(`${GUIDE_BASE}/missions`), 1);
    assert.equal(guideNavIndex(`${GUIDE_BASE}/qui-voit-quoi`), GUIDE_NAV.length - 1);
  });

  it("voisins : pas de Précédent sur l’accueil, pas de Suivant sur la dernière", () => {
    const home = guideNavNeighbors(GUIDE_BASE);
    assert.equal(home.prev, null);
    assert.equal(home.next?.path, `${GUIDE_BASE}/missions`);

    const last = guideNavNeighbors(`${GUIDE_BASE}/qui-voit-quoi`);
    assert.equal(last.next, null);
    assert.equal(last.prev?.path, `${GUIDE_BASE}/bdc-pa`);
  });

  it("voisins : page du milieu a Précédent et Suivant", () => {
    const mid = guideNavNeighbors(`${GUIDE_BASE}/cra`);
    assert.equal(mid.prev?.path, `${GUIDE_BASE}/missions`);
    assert.equal(mid.next?.path, `${GUIDE_BASE}/bdc-pa`);
  });
});
