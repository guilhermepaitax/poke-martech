import { ARENA_FLOOR } from "@/game/arena/assets/catalog";
import {
  createObstacle,
  placeObstacle,
  type Obstacle,
} from "@/game/arena/entities/obstacle";
import { placePlayer, type Player } from "@/game/arena/entities/player";
import { OBSTACLE_LAYOUT } from "@/lib/arena/obstacles";
import { arenaWorldSize } from "@/lib/arena/world-size";
import Phaser from "phaser";

const WALK_INSET = {
  top: 150,
  right: 180,
  bottom: 220,
  left: 200,
};

type ArenaWorld = {
  background: Phaser.GameObjects.Image;
  obstacles: Obstacle[];
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
};

type FighterAnchors = {
  playerX: number;
  playerY: number;
  opponentX: number;
  opponentY: number;
};

function createArenaWorld(scene: Phaser.Scene): ArenaWorld {
  const background = scene.add.image(0, 0, ARENA_FLOOR.key);
  const obstacles = OBSTACLE_LAYOUT.map((spec, index) =>
    createObstacle(scene, spec, (index + 1) * 0x9e3779b1),
  );
  return {
    background,
    obstacles,
    sourceWidth: background.width,
    sourceHeight: background.height,
    width: 0,
    height: 0,
  };
}

function layoutArena(
  scene: Phaser.Scene,
  world: ArenaWorld,
  anchors: FighterAnchors,
  player: Player | null,
  opponent: Player | null,
): FighterAnchors {
  const size = arenaWorldSize(
    scene.scale.width,
    scene.scale.height,
    world.sourceWidth,
    world.sourceHeight,
  );
  if (size.width === 0 || size.height === 0) return anchors;

  const next = { ...anchors };
  if (world.width > 0 && world.height > 0) {
    if (player) {
      next.playerX = player.sprite.x / world.width;
      next.playerY = player.sprite.y / world.height;
    }
    if (opponent) {
      next.opponentX = opponent.sprite.x / world.width;
      next.opponentY = opponent.sprite.y / world.height;
    }
  }

  world.background
    .setPosition(size.width / 2, size.height / 2)
    .setDisplaySize(size.width, size.height);
  scene.physics.world.setBounds(
    WALK_INSET.left,
    WALK_INSET.top,
    Math.max(size.width - WALK_INSET.left - WALK_INSET.right, 1),
    Math.max(size.height - WALK_INSET.top - WALK_INSET.bottom, 1),
  );
  scene.cameras.main.setBounds(0, 0, size.width, size.height);
  world.width = size.width;
  world.height = size.height;

  world.obstacles.forEach((obstacle) => {
    placeObstacle(scene, obstacle, size.width * obstacle.spec.x, size.height * obstacle.spec.y);
  });

  if (player) {
    placePlayer(player, size.width * next.playerX, size.height * next.playerY);
    scene.cameras.main.centerOn(player.sprite.x, player.sprite.y);
  }
  if (opponent) {
    placePlayer(opponent, size.width * next.opponentX, size.height * next.opponentY);
  }

  return next;
}

export { createArenaWorld, layoutArena };
export type { ArenaWorld, FighterAnchors };
