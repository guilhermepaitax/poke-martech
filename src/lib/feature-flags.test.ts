import { isFeatureEnabled, readFeatureFlags } from "@/lib/feature-flags.server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { evaluate, flagFns } = vi.hoisted(() => ({
  evaluate: vi.fn(),
  flagFns: {
    aiCardGeneration: vi.fn(),
    arena: vi.fn(),
    pokedex: vi.fn(),
    trocas: vi.fn(),
    loja: vi.fn(),
  },
}));

vi.mock("flags/next", () => ({ evaluate }));
vi.mock("@/flags", () => flagFns);

const allOn = {
  "ai-card-generation": true,
  arena: true,
  pokedex: true,
  trocas: true,
  loja: true,
};

describe("readFeatureFlags", () => {
  beforeEach(() => {
    evaluate.mockReset();
    for (const fn of Object.values(flagFns)) fn.mockReset();
  });

  it("monta o mapa a partir das avaliações", async () => {
    evaluate.mockResolvedValue(allOn);

    await expect(readFeatureFlags()).resolves.toEqual(allOn);
    expect(evaluate).toHaveBeenCalledWith({
      "ai-card-generation": flagFns.aiCardGeneration,
      arena: flagFns.arena,
      pokedex: flagFns.pokedex,
      trocas: flagFns.trocas,
      loja: flagFns.loja,
    });
  });

  it("mantém as outras flags quando uma avaliação vem desligada", async () => {
    evaluate.mockResolvedValue({ ...allOn, arena: false });

    await expect(readFeatureFlags()).resolves.toEqual({
      ...allOn,
      arena: false,
    });
  });

  it("desliga só a flag informada", async () => {
    flagFns.aiCardGeneration.mockResolvedValue(false);
    flagFns.arena.mockResolvedValue(true);
    flagFns.pokedex.mockResolvedValue(true);
    flagFns.trocas.mockResolvedValue(true);
    flagFns.loja.mockResolvedValue(true);

    await expect(isFeatureEnabled("ai-card-generation")).resolves.toBe(false);
    await expect(isFeatureEnabled("arena")).resolves.toBe(true);
    await expect(isFeatureEnabled("pokedex")).resolves.toBe(true);
    await expect(isFeatureEnabled("trocas")).resolves.toBe(true);
    await expect(isFeatureEnabled("loja")).resolves.toBe(true);
  });
});
