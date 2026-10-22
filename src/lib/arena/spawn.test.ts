import { describe, expect, it } from "vitest";
import { SPAWN_EDGE_MARGIN, spawnPoints } from "./spawn";

describe("spawnPoints", () => {
  it("põe cada lutador de um lado, longe da borda", () => {
    const { player, opponent } = spawnPoints({
      left: 200,
      right: 1800,
      centerX: 1000,
      centerY: 500,
    });

    expect(player).toEqual({ x: 200 + SPAWN_EDGE_MARGIN, y: 500 });
    expect(opponent).toEqual({ x: 1800 - SPAWN_EDGE_MARGIN, y: 500 });
  });

  it("em arena estreita os dois ficam no centro sem cruzar", () => {
    const { player, opponent } = spawnPoints({
      left: 0,
      right: 100,
      centerX: 50,
      centerY: 40,
    });

    expect(player.x).toBe(50);
    expect(opponent.x).toBe(50);
  });
});
