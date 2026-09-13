import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMissionProse, parseMissionProseInlines } from "./missionProseFormat.ts";

describe("parseMissionProseInlines", () => {
  it("conserve le texte sans lien", () => {
    assert.deepEqual(parseMissionProseInlines("Bonjour"), [
      { type: "text", value: "Bonjour" },
    ]);
  });

  it("extrait un lien Markdown http(s)", () => {
    const inlines = parseMissionProseInlines("voir [DOPAMIN](https://example.com/x) ici");
    assert.deepEqual(inlines, [
      { type: "text", value: "voir " },
      { type: "link", href: "https://example.com/x", label: "DOPAMIN" },
      { type: "text", value: " ici" },
    ]);
  });

  it("laisse tel quel un schéma non http", () => {
    const raw = "[x](javascript:alert(1))";
    assert.deepEqual(parseMissionProseInlines(raw), [{ type: "text", value: raw }]);
  });

  it("extrait le gras Markdown **…**", () => {
    assert.deepEqual(parseMissionProseInlines("**🎯 Objectif** suite"), [
      { type: "bold", value: "🎯 Objectif" },
      { type: "text", value: " suite" },
    ]);
  });

  it("combine gras et lien", () => {
    assert.deepEqual(
      parseMissionProseInlines("**Intro** puis [lien](https://a.test)."),
      [
        { type: "bold", value: "Intro" },
        { type: "text", value: " puis " },
        { type: "link", href: "https://a.test", label: "lien" },
        { type: "text", value: "." },
      ],
    );
  });
});

describe("parseMissionProse", () => {
  it("sépare paragraphes et listes", () => {
    const blocks = parseMissionProse(
      "Intro.\n\n* Un\n* Deux\n\nFin avec [lien](https://a.test).",
    );
    assert.equal(blocks.length, 3);
    assert.equal(blocks[0]!.type, "paragraph");
    assert.equal(blocks[1]!.type, "list");
    if (blocks[1]!.type === "list") {
      assert.equal(blocks[1].items.length, 2);
    }
    assert.equal(blocks[2]!.type, "paragraph");
  });

  it("fusionne les soft-wraps dans un paragraphe", () => {
    const blocks = parseMissionProse("ligne un\nligne deux");
    assert.equal(blocks.length, 1);
    assert.deepEqual(blocks[0], {
      type: "paragraph",
      inlines: [{ type: "text", value: "ligne un ligne deux" }],
    });
  });

  it("formate un extrait type Demande ISTF", () => {
    const blocks = parseMissionProse(
      "(provient de la carte [DOPAMIN](https://teams.microsoft.com/x))\n\nNouvelle demande.\n\n* Scénario 1\n* Scénario 2",
    );
    assert.equal(blocks[0]!.type, "paragraph");
    if (blocks[0]!.type === "paragraph") {
      assert.equal(blocks[0].inlines.some((i) => i.type === "link"), true);
    }
    assert.equal(blocks[2]!.type, "list");
  });
});
