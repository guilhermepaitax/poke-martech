import { describe, expect, it } from "vitest";
import { mapTerrain, zoneAt } from "@/lib/arena/terrain";

import { ARENA_MAPS, DEFAULT_MAP, findMap } from "./index";

const ART = { width: 1, height: 1 };

describe("ARENA_MAPS", () => {
  it("tem ids únicos e o padrão na lista", () => {
    const ids = ARENA_MAPS.map((map) => map.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_MAP.id);
  });

  it.each(ARENA_MAPS.map((map) => [map.id, map] as const))("%s tem zonas, obstáculos e spawn válidos", (_, map) => {
    const zones = mapTerrain(map);
    zones.forEach(({ rect }) => {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(1 + 1e-9);
      expect(rect.y + rect.height).toBeLessThanOrEqual(1 + 1e-9);
    });
    map.obstacles.forEach((spec) => {
      expect(spec.hp).toBeGreaterThan(0);
      expect(spec.x).toBeGreaterThan(0);
      expect(spec.x).toBeLessThan(1);
      expect(spec.y).toBeGreaterThan(0);
      expect(spec.y).toBeLessThan(1);
      expect(zoneAt(spec, zones, ART)).toBeNull();
    });
    if (map.spawn) {
      expect(zoneAt(map.spawn.player, zones, ART)).toBeNull();
      expect(zoneAt(map.spawn.opponent, zones, ART)).toBeNull();
    }
    if (zones.some((zone) => zone.kind === "water")) expect(map.water).toBeDefined();
  });
});

describe("findMap", () => {
  it("acha pelo id e devolve null para id desconhecido", () => {
    expect(findMap("ilha-das-estrelas")?.name).toBe("Ilha das Estrelas");
    expect(findMap("nada")).toBeNull();
    expect(findMap(null)).toBeNull();
  });
});
