import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyAssistantConfig,
  isAssistantConfigReady,
  normalizeAssistantBaseUrl,
} from "./assistantConfig.ts";

describe("normalizeAssistantBaseUrl", () => {
  it("retire les slashs finaux", () => {
    assert.equal(
      normalizeAssistantBaseUrl(" https://example.test/v1/ "),
      "https://example.test/v1",
    );
  });
});

describe("isAssistantConfigReady", () => {
  it("exige une URL", () => {
    assert.equal(isAssistantConfigReady(emptyAssistantConfig()), false);
    assert.equal(
      isAssistantConfigReady({
        baseUrl: "https://user-x-user.user.lab.sspcloud.fr",
        sharedSecret: "",
      }),
      true,
    );
  });
});
