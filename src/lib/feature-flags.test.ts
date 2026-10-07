import { afterEach, describe, expect, it } from "vitest";
import { isFeatureEnabled, readFeatureFlags } from "@/lib/feature-flags";

const ENV_KEYS = [
  "FEATURE_FLAG_BATTLE",
  "FEATURE_FLAG_AI_CARD_GENERATION",
  "FEATURE_FLAG_OPPONENT_REGISTRATION",
] as const;

describe("readFeatureFlags", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  it("mantém as funcionalidades ativas quando as variáveis não estão definidas", () => {
    expect(readFeatureFlags()).toEqual({
      battle: true,
      "ai-card-generation": true,
      "opponent-registration": true,
    });
  });

  it("desativa só a flag informada", () => {
    process.env.FEATURE_FLAG_BATTLE = "false";
    process.env.FEATURE_FLAG_AI_CARD_GENERATION = "off";
    process.env.FEATURE_FLAG_OPPONENT_REGISTRATION = "0";

    expect(isFeatureEnabled("battle")).toBe(false);
    expect(isFeatureEnabled("ai-card-generation")).toBe(false);
    expect(isFeatureEnabled("opponent-registration")).toBe(false);
  });

  it("aceita valores afirmativos sem diferenciar maiúsculas", () => {
    process.env.FEATURE_FLAG_BATTLE = "TRUE";
    process.env.FEATURE_FLAG_OPPONENT_REGISTRATION = "no";

    expect(isFeatureEnabled("battle")).toBe(true);
    expect(isFeatureEnabled("opponent-registration")).toBe(false);
  });
});
