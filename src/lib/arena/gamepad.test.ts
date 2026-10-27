import { describe, expect, it } from "vitest";
import { applyDeadzone, clampMove, mergeMove, padAimPoint } from "./gamepad";

describe("applyDeadzone", () => {
  it("zera o analógico dentro da zona morta", () => {
    expect(applyDeadzone(0.1, -0.1)).toEqual({ x: 0, y: 0 });
  });

  it("reescala para começar em zero logo depois da zona morta", () => {
    const move = applyDeadzone(0.6, 0);

    expect(move.x).toBeCloseTo(0.5, 5);
    expect(move.y).toBe(0);
  });

  it("tombo total chega a módulo 1", () => {
    const move = applyDeadzone(1, 1);

    expect(Math.hypot(move.x, move.y)).toBeCloseTo(1, 5);
  });
});

describe("clampMove", () => {
  it("mantém meio tombo do analógico", () => {
    expect(clampMove(0.5, 0)).toEqual({ x: 0.5, y: 0 });
  });

  it("limita a diagonal do teclado a módulo 1", () => {
    const move = clampMove(1, 1);

    expect(Math.hypot(move.x, move.y)).toBeCloseTo(1, 5);
  });
});

describe("mergeMove", () => {
  it("teclado e controle juntos não passam de módulo 1", () => {
    const move = mergeMove({ x: 1, y: 0 }, { x: 1, y: 0 });

    expect(move).toEqual({ x: 1, y: 0 });
  });

  it("sem teclado usa só o controle", () => {
    expect(mergeMove({ x: 0, y: 0 }, { x: 0, y: -0.4 })).toEqual({ x: 0, y: -0.4 });
  });
});

describe("padAimPoint", () => {
  const origin = { x: 100, y: 100 };
  const opponent = { x: 400, y: 300 };

  it("analógico solto mira no oponente", () => {
    expect(padAimPoint(origin, { x: 0, y: 0 }, opponent, 180)).toEqual(opponent);
  });

  it("analógico mexido aponta na direção dele a distância fixa", () => {
    const point = padAimPoint(origin, { x: 0, y: -0.3 }, opponent, 180);

    expect(point.x).toBeCloseTo(100, 5);
    expect(point.y).toBeCloseTo(-80, 5);
  });
});
