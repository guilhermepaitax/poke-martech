import { describe, expect, it } from "vitest";
import { mapEnergyCost, mapPokemonType, mapRarity, playStage } from "./types";

describe("mapa de tipos do Genetic Apex", () => {
  it("traduz os tipos reais para os tipos do jogo", () => {
    expect(mapPokemonType("Grass")).toBe("careca");
    expect(mapPokemonType("Fire")).toBe("devops");
    expect(mapPokemonType("Water")).toBe("ux-ui");
    expect(mapPokemonType("Lightning")).toBe("full-stack");
    expect(mapPokemonType("Psychic")).toBe("frontend");
    expect(mapPokemonType("Fighting")).toBe("qa");
    expect(mapPokemonType("Darkness")).toBe("backend");
    expect(mapPokemonType("Metal")).toBe("testes-automatizados");
    expect(mapPokemonType("Dragon")).toBe("admin-generico");
    expect(mapPokemonType("Colorless")).toBe("ia");
  });

  it("agrupa o custo e trata incolor como IA", () => {
    expect(mapEnergyCost(["Grass", "Colorless", "Colorless"])).toEqual([
      { type: "careca", count: 1 },
      { type: "ia", count: 2 },
    ]);
  });

  it("mapeia raridade e estágio jogável", () => {
    expect(mapRarity("One Diamond")).toBe("common");
    expect(mapRarity("Two Diamond")).toBe("uncommon");
    expect(mapRarity("Three Diamond")).toBe("rare");
    expect(mapRarity("Four Diamond")).toBe("double_rare");
    expect(playStage("Stage2", true)).toBe("stage2");
    expect(playStage("Stage1", false)).toBe("basic");
  });
});
