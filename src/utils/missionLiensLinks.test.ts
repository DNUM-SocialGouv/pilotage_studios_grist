import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMissionLiensLinks } from "./missionLiensLinks.ts";

describe("parseMissionLiensLinks", () => {
  it("retourne vide pour absents", () => {
    assert.deepEqual(parseMissionLiensLinks(undefined), []);
    assert.deepEqual(parseMissionLiensLinks(""), []);
    assert.deepEqual(parseMissionLiensLinks("   "), []);
  });

  it("détecte une URL nue (Notion JPME)", () => {
    const href =
      "https://app.notion.com/p/JPME-Je-Prot-ge-mon-enfant-321d6f4513d380ad909dcf32aac3f13a?source=copy_link";
    assert.deepEqual(parseMissionLiensLinks(href), [{ href, label: href }]);
  });

  it("détecte un lien Markdown", () => {
    assert.deepEqual(parseMissionLiensLinks("[Figma](https://www.figma.com/file/abc)"), [
      { href: "https://www.figma.com/file/abc", label: "Figma" },
    ]);
  });

  it("mélange Markdown et URL nue sans doublon", () => {
    const href = "https://www.figma.com/file/abc";
    const raw = `[Figma](${href})\n${href}`;
    assert.deepEqual(parseMissionLiensLinks(raw), [{ href, label: "Figma" }]);
  });

  it("ignore les schémas non http(s)", () => {
    assert.deepEqual(parseMissionLiensLinks("javascript:alert(1)"), []);
    assert.deepEqual(parseMissionLiensLinks("[x](javascript:alert(1))"), []);
  });
});
