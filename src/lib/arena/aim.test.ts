import { describe, expect, it } from "vitest";

import { aimPower, aimReach, conePolygon, coneWidth, powerForDistance, type ConeAim } from "./aim";

const cone: ConeAim = { kind: "cone", range: 400, minRange: 100, nearWidth: 40, farWidth: 200, powerMs: 1000 };

describe("força da mira", () => {
  it("enche linear com o tempo segurado e trava no máximo", () => {
    expect(aimPower(0, 1000)).toBe(0);
    expect(aimPower(500, 1000)).toBe(0.5);
    expect(aimPower(5000, 1000)).toBe(1);
    expect(aimPower(Number.NaN, 1000)).toBe(0);
  });

  it("vai do alcance mínimo ao máximo", () => {
    expect(aimReach(cone, 0)).toBe(100);
    expect(aimReach(cone, 0.5)).toBe(250);
    expect(aimReach(cone, 2)).toBe(400);
  });

  it("acha a força para cair numa distância", () => {
    expect(powerForDistance(cone, 250)).toBe(0.5);
    expect(powerForDistance(cone, 50)).toBe(0);
    expect(powerForDistance(cone, 900)).toBe(1);
  });
});

describe("cone", () => {
  it("abre da boca até a ponta", () => {
    expect(coneWidth(cone, 0)).toBe(40);
    expect(coneWidth(cone, 200)).toBe(120);
    expect(coneWidth(cone, 400)).toBe(200);
  });

  it("monta o quadrilátero na direção da mira", () => {
    const [nearLeft, farLeft, farRight, nearRight] = conePolygon({ x: 0, y: 0 }, { x: 1, y: 0 }, cone);
    expect(nearLeft).toEqual({ x: 0, y: 20 });
    expect(farLeft).toEqual({ x: 400, y: 100 });
    expect(farRight).toEqual({ x: 400, y: -100 });
    expect(nearRight).toEqual({ x: 0, y: -20 });
    expect(conePolygon({ x: 0, y: 0 }, { x: 0, y: 0 }, cone)).toEqual([]);
  });
});
