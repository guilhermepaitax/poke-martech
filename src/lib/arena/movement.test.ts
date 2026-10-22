import { describe, expect, it } from "vitest";
import {
  cardinalFacing,
  dashHeading,
  facingFromAim,
  facingFromMove,
  normalizeMove,
} from "./movement";

describe("normalizeMove", () => {
  it("mantém um eixo unitário", () => {
    expect(normalizeMove(1, 0)).toEqual({ x: 1, y: 0 });
    expect(normalizeMove(0, -1)).toEqual({ x: 0, y: -1 });
    expect(normalizeMove(-1, 0)).toEqual({ x: -1, y: 0 });
  });

  it("deixa a diagonal com o mesmo módulo de um eixo", () => {
    const move = normalizeMove(1, 1);

    expect(Math.hypot(move.x, move.y)).toBeCloseTo(1, 5);
    expect(move.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(move.y).toBeCloseTo(Math.SQRT1_2, 5);
    expect(Math.hypot(move.x, move.y)).toBeCloseTo(Math.hypot(normalizeMove(1, 0).x, normalizeMove(1, 0).y), 5);
  });

  it("devolve zero quando não há input", () => {
    expect(normalizeMove(0, 0)).toEqual({ x: 0, y: 0 });
  });
});

describe("facingFromMove", () => {
  it("escolhe o cardinal do eixo", () => {
    expect(facingFromMove(1, 0, "south")).toBe("east");
    expect(facingFromMove(-1, 0, "south")).toBe("west");
    expect(facingFromMove(0, 1, "east")).toBe("south");
    expect(facingFromMove(0, -1, "east")).toBe("north");
  });

  it("no empate de 45 graus fica no eixo horizontal", () => {
    expect(facingFromMove(1, 1, "south")).toBe("east");
    expect(facingFromMove(1, -1, "south")).toBe("east");
    expect(facingFromMove(-1, 1, "south")).toBe("west");
    expect(facingFromMove(-1, -1, "south")).toBe("west");
  });

  it("usa o eixo vertical quando ele é mais próximo", () => {
    expect(facingFromMove(0.4, 1, "east")).toBe("south");
    expect(facingFromMove(-0.2, -1, "east")).toBe("north");
  });

  it("mantém a direção anterior sem input", () => {
    expect(facingFromMove(0, 0, "north")).toBe("north");
  });
});

describe("facingFromAim", () => {
  it("escolhe os oito octantes da mira", () => {
    expect(facingFromAim(1, 0, "south")).toBe("east");
    expect(facingFromAim(1, 1, "south")).toBe("south-east");
    expect(facingFromAim(0, 1, "east")).toBe("south");
    expect(facingFromAim(-1, 1, "south")).toBe("south-west");
    expect(facingFromAim(-1, 0, "south")).toBe("west");
    expect(facingFromAim(-1, -1, "south")).toBe("north-west");
    expect(facingFromAim(0, -1, "east")).toBe("north");
    expect(facingFromAim(1, -1, "south")).toBe("north-east");
  });

  it("mantém a direção anterior sem input", () => {
    expect(facingFromAim(0, 0, "north-west")).toBe("north-west");
  });
});

describe("cardinalFacing", () => {
  it("leva a diagonal para o eixo horizontal da folha de ataque", () => {
    expect(cardinalFacing("south-east")).toBe("east");
    expect(cardinalFacing("north-east")).toBe("east");
    expect(cardinalFacing("south-west")).toBe("west");
    expect(cardinalFacing("north-west")).toBe("west");
    expect(cardinalFacing("north")).toBe("north");
  });
});

describe("dashHeading", () => {
  it("segue o input de movimento, normalizado", () => {
    const heading = dashHeading({ x: 1, y: -1 }, "west");

    expect(Math.hypot(heading.x, heading.y)).toBeCloseTo(1, 5);
    expect(heading.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(heading.y).toBeCloseTo(-Math.SQRT1_2, 5);
  });

  it("sem input usa a direção para onde o lutador olha", () => {
    const heading = dashHeading({ x: 0, y: 0 }, "north");

    expect(heading.x).toBeCloseTo(0, 5);
    expect(heading.y).toBeCloseTo(-1, 5);
  });
});
