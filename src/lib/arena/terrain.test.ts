import { describe, expect, it } from "vitest";
import { blockedRects, canEnter, mapTerrain, isWaterAt, terrainScale, toWorldRect, zoneAt, type TerrainZone } from "./terrain";

const size = { width: 1000, height: 500 };
const zones: TerrainZone[] = [
  { kind: "water", rect: { x: 0, y: 0, width: 0.5, height: 0.5 } },
  { kind: "rock", rect: { x: 0.4, y: 0.4, width: 0.2, height: 0.2 } },
];

describe("canEnter", () => {
  it("água aceita quem nada ou voa; rocha só quem voa", () => {
    expect(canEnter("water")).toBe(false);
    expect(canEnter("water", ["swim"])).toBe(true);
    expect(canEnter("water", ["fly"])).toBe(true);
    expect(canEnter("rock", ["swim"])).toBe(false);
    expect(canEnter("rock", ["fly"])).toBe(true);
  });
});

describe("zoneAt", () => {
  it("converte a fração para o mundo e prioriza rocha", () => {
    expect(toWorldRect(zones[0]!.rect, size)).toEqual({ x: 0, y: 0, width: 500, height: 250 });
    expect(zoneAt({ x: 100, y: 100 }, zones, size)).toBe("water");
    expect(zoneAt({ x: 450, y: 220 }, zones, size)).toBe("rock");
    expect(zoneAt({ x: 900, y: 400 }, zones, size)).toBeNull();
    expect(isWaterAt({ x: 100, y: 100 }, zones, size)).toBe(true);
  });
});

describe("blockedRects", () => {
  it("devolve só as zonas que o lutador não atravessa", () => {
    expect(blockedRects(zones, size)).toHaveLength(2);
    expect(blockedRects(zones, size, ["swim"])).toEqual([{ x: 400, y: 200, width: 200, height: 100 }]);
    expect(blockedRects(zones, size, ["fly"])).toHaveLength(0);
  });
});

describe("terrainScale", () => {
  const boost = { speedScale: 1.2, damageScale: 1.25 };

  it("dá bônus só para quem nada e está na água", () => {
    expect(terrainScale(boost, ["swim"], true)).toEqual({ speed: 1.2, damage: 1.25 });
    expect(terrainScale(boost, ["swim"], false)).toEqual({ speed: 1, damage: 1 });
    expect(terrainScale(boost, ["fly"], true)).toEqual({ speed: 1, damage: 1 });
    expect(terrainScale(undefined, ["swim"], true)).toEqual({ speed: 1, damage: 1 });
  });
});

describe("mapTerrain", () => {
  it("soma zonas manuais e áreas do editor (bloqueado vira rocha)", () => {
    const rect = { x: 0.1, y: 0.1, width: 0.1, height: 0.1 };
    expect(mapTerrain({ terrain: [], blockedAreas: [rect], waterAreas: [rect] })).toEqual([
      { kind: "water", rect },
      { kind: "rock", rect },
    ]);
    expect(mapTerrain({ terrain: zones })).toEqual(zones);
  });
});
