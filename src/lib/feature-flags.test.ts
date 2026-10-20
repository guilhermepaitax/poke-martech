import { afterEach, describe, expect, it } from "vitest";
import { isFeatureEnabled, readFeatureFlags } from "@/lib/feature-flags";

const ENV_KEYS = ["FEATURE_FLAG_AI_CARD_GENERATION"] as const;

describe("readFeatureFlags", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("mantém as funcionalidades ativas quando as variáveis não estão definidas", () => {
    expect(readFeatureFlags()).toEqual({
      "ai-card-generation": true,
    });
  });

  it("desativa só a flag informada", () => {
    process.env.FEATURE_FLAG_AI_CARD_GENERATION = "off";

    expect(isFeatureEnabled("ai-card-generation")).toBe(false);
  });

  it("aceita valores afirmativos sem diferenciar maiúsculas", () => {
    process.env.FEATURE_FLAG_AI_CARD_GENERATION = "TRUE";

    expect(isFeatureEnabled("ai-card-generation")).toBe(true);
  });
});
