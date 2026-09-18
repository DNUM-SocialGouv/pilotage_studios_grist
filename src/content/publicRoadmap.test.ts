import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  groupPublicRoadmapByKanban,
  groupPublicRoadmapByTheme,
  PUBLIC_ROADMAP_ITEMS,
  PUBLIC_ROADMAP_THEMES,
  ROADMAP_KANBAN_COLUMNS,
  roadmapStatusToKanbanColumn,
} from "./publicRoadmap.ts";

describe("groupPublicRoadmapByKanban", () => {
  it("ordonne Backlog → En cours → Livré et conserve tous les items", () => {
    const groups = groupPublicRoadmapByKanban();
    assert.deepEqual(
      groups.map((g) => g.column.id),
      ROADMAP_KANBAN_COLUMNS.map((c) => c.id),
    );
    assert.equal(
      groups.reduce((n, g) => n + g.items.length, 0),
      PUBLIC_ROADMAP_ITEMS.length,
    );
    for (const group of groups) {
      for (const item of group.items) {
        assert.equal(roadmapStatusToKanbanColumn(item.status), group.column.id);
      }
    }
  });

  it("classe Livré en antéchronologique (dernier done en tête)", () => {
    const doneInSourceOrder = PUBLIC_ROADMAP_ITEMS.filter((i) => i.status === "done");
    const livre = groupPublicRoadmapByKanban().find((g) => g.column.id === "livre");
    assert.ok(livre);
    assert.ok(doneInSourceOrder.length >= 2);
    assert.deepEqual(
      livre.items.map((i) => i.id),
      [...doneInSourceOrder].reverse().map((i) => i.id),
    );
  });
});

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
    }
  });
});
