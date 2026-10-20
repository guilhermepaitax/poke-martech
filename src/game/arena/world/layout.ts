import { ARENA_FLOOR } from "@/game/arena/assets/catalog";
import { placePlayer, type Player } from "@/game/arena/entities/player";
import { arenaWorldSize } from "@/lib/arena/world-size";
import Phaser from "phaser";

const WALK_INSET = {
  top: 150,
  right: 180,
  bottom: 220,
  left: 200,
};

const ARENA_BLOCKS = [
  { x: 0.28, y: 0.34, width: 160, height: 36 },
  { x: 0.68, y: 0.68, width: 48, height: 140 },
] as const;

const OPPONENT_GAP = 180;
const OPPONENT_EDGE_MARGIN = 48;

type ArenaWorld = {
  background: Phaser.GameObjects.Image;
  blocks: Phaser.GameObjects.Rectangle[];
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

function createArenaWorld(scene: Phaser.Scene, blockColors: readonly number[]): ArenaWorld {
  const background = scene.add.image(0, 0, ARENA_FLOOR.key);
  const blocks = blockColors.map((color) => {
    const block = scene.add.rectangle(0, 0, 1, 1, color);
    scene.physics.add.existing(block, true);
    return block;
  });
  return {
    background,
    blocks,
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

  world.blocks.forEach((block, index) => {
    const spec = ARENA_BLOCKS[index];
    if (!spec) return;
    block
      .setPosition(size.width * spec.x, size.height * spec.y)
      .setSize(spec.width, spec.height);
    if (block.body instanceof Phaser.Physics.Arcade.StaticBody) {
      block.body.updateFromGameObject();
    }
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

function opponentSpawnPoint(bounds: { centerX: number; centerY: number; right: number }) {
  const room = bounds.right - bounds.centerX - OPPONENT_EDGE_MARGIN;
  return {
    x: bounds.centerX + Math.max(Math.min(OPPONENT_GAP, room), 0),
    y: bounds.centerY,
  };
}

export { createArenaWorld, layoutArena, opponentSpawnPoint };
export type { ArenaWorld, FighterAnchors };
