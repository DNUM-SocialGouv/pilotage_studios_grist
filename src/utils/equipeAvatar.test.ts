import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { equipeAvatarSeed, equipeAvatarUrl } from "./equipeAvatar.ts";

describe("equipeAvatarSeed", () => {
  it("utilise le seed Grist s’il est renseigné", () => {
    assert.equal(equipeAvatarSeed("  abc-123  ", 7), "abc-123");
  });

  it("replie sur equipe-{id} si vide", () => {
    assert.equal(equipeAvatarSeed(undefined, 42), "equipe-42");
    assert.equal(equipeAvatarSeed("", 42), "equipe-42");
    assert.equal(equipeAvatarSeed("   ", 42), "equipe-42");
  });
});

describe("equipeAvatarUrl", () => {
  it("construit l’URL Pixelbot 10.x avec seed encodé", () => {
    assert.equal(
      equipeAvatarUrl("hello world", 1),
      "https://api.dicebear.com/10.x/pixelbot/svg?seed=hello%20world",
    );
    assert.equal(
      equipeAvatarUrl(undefined, 9),
      "https://api.dicebear.com/10.x/pixelbot/svg?seed=equipe-9",
    );
  });
});
