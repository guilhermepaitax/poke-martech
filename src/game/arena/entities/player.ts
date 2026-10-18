import {
  facingFromMove,
  normalizeMove,
  type CardinalFacing,
} from "@/lib/arena/movement";
import Phaser from "phaser";

const PLAYER_CELL_SIZE = 128;
const PLAYER_SHEETS = {
  idle: {
    key: "antoniomander-idle",
    path: "/arena/antoniomander-idle.png",
  },
  walk: {
    key: "antoniomander-walk",
    path: "/arena/antoniomander-walk.png",
  },
} as const;
const PLAYER_COLUMNS = 8;
const PLAYER_DISPLAY_SIZE = 96;
const PLAYER_SPEED = 340;
// const PLAYER_SPEED = 700;
const PLAYER_BODY_WIDTH = 60;
const PLAYER_BODY_HEIGHT = 100;
const PLAYER_BODY_OFFSET_X = (PLAYER_CELL_SIZE - PLAYER_BODY_WIDTH) / 2;
const PLAYER_BODY_OFFSET_Y = 20;
const IDLE_FRAME_RATE = 8;
const WALK_FRAME_RATE = 12;
const PLAYER_NAME = "Antoniomander";
const PLAYER_HP_RATIO = 1;
const FEET_OFFSET_Y = 36;
const GROUND_DEPTH = 1;
const PLAYER_DEPTH = 2;
const PLATE_DEPTH = 3;
const RING_WIDTH = 70;
const RING_HEIGHT = 18;
const SHADOW_WIDTH = 70;
const SHADOW_HEIGHT = 22;
const BAR_WIDTH = 70;
const BAR_HEIGHT = 8;
const BAR_INSET = 2;
const BAR_OFFSET_Y = 20;
const NAME_OFFSET_Y = 25;

const DIRECTION_ROW = {
  south: 1,
  east: 2,
  north: 3,
  west: 4,
} as const;

type Player = {
  sprite: Phaser.Physics.Arcade.Sprite;
  facing: CardinalFacing;
  ground: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Container;
  hpFill: Phaser.GameObjects.Rectangle;
};

function animationKey(action: "idle" | "walk", facing: CardinalFacing) {
  return `${action}-${facing}`;
}

function ensureCharacterAnimations(scene: Phaser.Scene) {
  (
    [
      ["idle", IDLE_FRAME_RATE],
      ["walk", WALK_FRAME_RATE],
    ] as const
  ).forEach(([action, frameRate]) => {
    (["south", "east", "north", "west"] as const).forEach((direction) => {
      const key = animationKey(action, direction);
      if (scene.anims.exists(key)) return;
      const start = DIRECTION_ROW[direction] * PLAYER_COLUMNS;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(PLAYER_SHEETS[action].key, {
          start,
          end: start + PLAYER_COLUMNS - 1,
        }),
        frameRate,
        repeat: -1,
      });
    });
  });
}

function markerFont() {
  if (typeof document === "undefined") return "sans-serif";
  const font = getComputedStyle(document.body).fontFamily.trim();
  return font || "sans-serif";
}

function createPlayer(scene: Phaser.Scene, x: number, y: number): Player {
  ensureCharacterAnimations(scene);
  const feetY = y + FEET_OFFSET_Y;
  const shadow = scene.add.ellipse(
    0,
    3,
    SHADOW_WIDTH,
    SHADOW_HEIGHT,
    0x120c08,
    0.4,
  );
  const ringShade = scene.add.ellipse(
    0,
    1,
    RING_WIDTH + 6,
    RING_HEIGHT + 4,
    0x2a1a0c,
    0,
  );
  ringShade.setStrokeStyle(4, 0x2a1a0c, 0.4);
  const ring = scene.add.ellipse(0, 0, RING_WIDTH, RING_HEIGHT, 0xffe08a, 0);
  ring.setStrokeStyle(2, 0xffe08a, 1);
  ring.setSmoothness(32);
  ringShade.setSmoothness(32);
  const ground = scene.add.container(x, feetY, [shadow, ringShade, ring]);
  ground.setDepth(GROUND_DEPTH);

  const sprite = scene.physics.add.sprite(
    x,
    y,
    PLAYER_SHEETS.idle.key,
    DIRECTION_ROW.south * PLAYER_COLUMNS,
  );
  sprite.setDisplaySize(PLAYER_DISPLAY_SIZE, PLAYER_DISPLAY_SIZE);
  sprite.setDepth(PLAYER_DEPTH);
  scene.textures
    .get(PLAYER_SHEETS.idle.key)
    .setFilter(Phaser.Textures.FilterMode.NEAREST);
  scene.textures
    .get(PLAYER_SHEETS.walk.key)
    .setFilter(Phaser.Textures.FilterMode.NEAREST);
  sprite.setCollideWorldBounds(true);
  const body = sprite.body;
  if (body instanceof Phaser.Physics.Arcade.Body) {
    body.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT, false);
    body.setOffset(PLAYER_BODY_OFFSET_X, PLAYER_BODY_OFFSET_Y);
  }
  sprite.play(animationKey("idle", "south"));

  const hpTrack = scene.add.rectangle(
    0,
    BAR_OFFSET_Y,
    BAR_WIDTH,
    BAR_HEIGHT,
    0x111429,
    1,
  );
  const fillWidth = (BAR_WIDTH - BAR_INSET * 2) * PLAYER_HP_RATIO;
  const hpFill = scene.add.rectangle(
    -BAR_WIDTH / 2 + BAR_INSET + fillWidth / 2,
    BAR_OFFSET_Y,
    fillWidth,
    BAR_HEIGHT - BAR_INSET * 2,
    0x62d26f,
    1,
  );
  const nameLabel = scene.add
    .text(0, NAME_OFFSET_Y, PLAYER_NAME, {
      fontFamily: markerFont(),
      fontSize: "12px",
      color: "#f7f3ea",
    })
    .setOrigin(0.5, 0)
    .setStroke("#2a1c10", 3);
  const plate = scene.add.container(x, feetY, [hpTrack, hpFill, nameLabel]);
  plate.setDepth(PLATE_DEPTH);

  return { sprite, facing: "south", ground, plate, hpFill };
}

function syncPlayerMarker(player: Player) {
  const x = player.sprite.x;
  const feetY = player.sprite.y + FEET_OFFSET_Y;
  player.ground.setPosition(x, feetY);
  player.plate.setPosition(x, feetY);
}

function updatePlayer(player: Player, x: number, y: number) {
  const move = normalizeMove(x, y);
  player.sprite.setVelocity(move.x * PLAYER_SPEED, move.y * PLAYER_SPEED);
  const facing = facingFromMove(move.x, move.y, player.facing);
  player.facing = facing;
  const moving = move.x !== 0 || move.y !== 0;
  const animation = animationKey(moving ? "walk" : "idle", facing);
  if (player.sprite.anims.currentAnim?.key !== animation)
    player.sprite.play(animation);
}

function placePlayer(player: Player, x: number, y: number) {
  const body = player.sprite.body;
  if (body instanceof Phaser.Physics.Arcade.Body) body.reset(x, y);
  else player.sprite.setPosition(x, y);
  syncPlayerMarker(player);
}

export {
  createPlayer,
  placePlayer,
  PLAYER_CELL_SIZE,
  PLAYER_SHEETS,
  syncPlayerMarker,
  updatePlayer,
};
export type { Player };
