import { describe, expect, it } from "vitest";
import { arenaWorldSize } from "./world-size";

describe("arenaWorldSize", () => {
  it("mantém a proporção da imagem e deixa o mundo maior que a visão nos dois eixos", () => {
    const world = arenaWorldSize(1600, 800, 1024, 576);

    expect(world.width / world.height).toBeCloseTo(1024 / 576, 5);
    expect(world.width).toBeGreaterThan(1600);
    expect(world.height).toBeGreaterThan(800);
  });

  it("também sobra área fora da visão quando a tela é mais alta que a imagem", () => {
    const world = arenaWorldSize(900, 1000, 1024, 576);

    expect(world.width / world.height).toBeCloseTo(1024 / 576, 5);
    expect(world.width).toBeGreaterThan(900);
    expect(world.height).toBeGreaterThan(1000);
  });

  it("não cria um mundo quando alguma medida é inválida", () => {
    expect(arenaWorldSize(0, 800, 1024, 576)).toEqual({ width: 0, height: 0 });
  });
});
