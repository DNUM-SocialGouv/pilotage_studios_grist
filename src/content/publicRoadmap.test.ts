import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PUBLIC_ROADMAP_ITEMS,
  ROADMAP_STATUS_LABEL,
  type PublicRoadmapStatus,
} from "./publicRoadmap.ts";

describe("publicRoadmap", () => {
  it("expose au moins un item En cours et des À venir avec issue", () => {
    const current = PUBLIC_ROADMAP_ITEMS.filter((i) => i.status === "current");
    const next = PUBLIC_ROADMAP_ITEMS.filter((i) => i.status === "next");
    assert.equal(current.length, 1);
    assert.ok(next.length >= 2);
    for (const item of [...current, ...next]) {
      assert.ok(item.issueUrl?.startsWith("https://github.com/"), item.id);
    }
  });

  it("ordonne prestations avant CRA avant intervenants avant plus tard", () => {
    const ids = PUBLIC_ROADMAP_ITEMS.map((i) => i.id);
    const prestations = ids.indexOf("prestations");
    const cra = ids.indexOf("cra-suivre");
    const intervenants = ids.indexOf("intervenants-droits");
    const produits = ids.indexOf("produits-pv");
    assert.ok(prestations < cra && cra < intervenants && intervenants < produits);
  });

  it("a un libellé pour chaque statut", () => {
    const statuses: PublicRoadmapStatus[] = ["done", "current", "next", "later"];
    for (const s of statuses) {
      assert.ok(ROADMAP_STATUS_LABEL[s].length > 0);
    }
  });
});
