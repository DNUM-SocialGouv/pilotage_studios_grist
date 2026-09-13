import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  groupPublicRoadmapByTheme,
  PUBLIC_ROADMAP_ITEMS,
  PUBLIC_ROADMAP_THEMES,
} from "./publicRoadmap.ts";

describe("groupPublicRoadmapByTheme", () => {
  it("conserve tous les items et l’ordre des thèmes", () => {
    const groups = groupPublicRoadmapByTheme();
    assert.equal(
      groups.reduce((n, g) => n + g.items.length, 0),
      PUBLIC_ROADMAP_ITEMS.length,
    );
    const themeIds = groups.map((g) => g.theme.id);
    const expectedOrder = PUBLIC_ROADMAP_THEMES.map((t) => t.id).filter((id) =>
      PUBLIC_ROADMAP_ITEMS.some((item) => item.themeId === id),
    );
    assert.deepEqual(themeIds, expectedOrder);
  });

  it("chaque item a un guide complet", () => {
    for (const item of PUBLIC_ROADMAP_ITEMS) {
      assert.ok(item.guide.lead.trim().length > 0, item.id);
      assert.ok(item.guide.steps.length > 0, item.id);
      assert.ok(item.guide.diagram.nodes.length > 0, item.id);
    }
  });
});
