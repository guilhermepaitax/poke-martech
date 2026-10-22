import type { Point } from "@/lib/arena/combat";

const SPAWN_EDGE_MARGIN = 120;

type SpawnBounds = {
  left: number;
  right: number;
  centerX: number;
  centerY: number;
};

function spawnPoints(bounds: SpawnBounds): { player: Point; opponent: Point } {
  const room = Math.max(bounds.centerX - bounds.left - SPAWN_EDGE_MARGIN, 0);
  return {
    player: { x: bounds.centerX - room, y: bounds.centerY },
    opponent: { x: bounds.centerX + room, y: bounds.centerY },
  };
}

export { SPAWN_EDGE_MARGIN, spawnPoints };
export type { SpawnBounds };
