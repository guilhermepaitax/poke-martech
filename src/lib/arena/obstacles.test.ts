import { describe, expect, it } from "vitest";
import { crackStage, damageObstacle, OBSTACLE_LAYOUT } from "./obstacles";

describe("damageObstacle", () => {
  it("desconta o dano sem passar de zero", () => {
    expect(damageObstacle(50, 20)).toEqual({ hp: 30, broken: false });
    expect(damageObstacle(10, 25)).toEqual({ hp: 0, broken: true });
  });

  it("ignora dano negativo e mantém quebrado o que já quebrou", () => {
    expect(damageObstacle(40, -5)).toEqual({ hp: 40, broken: false });
    expect(damageObstacle(0, 10)).toEqual({ hp: 0, broken: true });
  });
});

describe("crackStage", () => {
  it("fica intacto com vida cheia", () => {
    expect(crackStage(100, 100)).toBe(0);
  });

  it("racha já no primeiro golpe e piora conforme perde vida", () => {
    expect(crackStage(95, 100)).toBe(1);
    expect(crackStage(75, 100)).toBe(1);
    expect(crackStage(60, 100)).toBe(2);
    expect(crackStage(50, 100)).toBe(2);
    expect(crackStage(30, 100)).toBe(3);
    expect(crackStage(1, 100)).toBe(3);
  });
});

describe("OBSTACLE_LAYOUT", () => {
  it("tem tamanhos variados e vida positiva", () => {
    const areas = new Set(OBSTACLE_LAYOUT.map((spec) => spec.width * spec.height));
    expect(areas.size).toBeGreaterThan(2);
    OBSTACLE_LAYOUT.forEach((spec) => {
      expect(spec.hp).toBeGreaterThan(0);
      expect(spec.x).toBeGreaterThan(0);
      expect(spec.x).toBeLessThan(1);
      expect(spec.y).toBeGreaterThan(0);
      expect(spec.y).toBeLessThan(1);
    });
  });
});
