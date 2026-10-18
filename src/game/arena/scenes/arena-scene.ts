import { cssColorNumber } from "@/game/arena/css-color";
import {
  PLAYER_CELL_SIZE,
  PLAYER_SHEETS,
  createPlayer,
  placePlayer,
  syncPlayerMarker,
  updatePlayer,
  type Player,
} from "@/game/arena/entities/player";
import { arenaWorldSize } from "@/lib/arena/world-size";
import Phaser from "phaser";

const ARENA_FLOOR_KEY = "arena-floor";

const ARENA_WALK_INSET = {
  top: 150,
  right: 180,
  bottom: 220,
  left: 200,
};

const BLOCKS = [
  { x: 0.28, y: 0.34, width: 160, height: 36 },
  { x: 0.68, y: 0.68, width: 48, height: 140 },
] as const;

const ARROW_CODES = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

type ArenaKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

function axis(negative: boolean, positive: boolean) {
  if (negative === positive) return 0;
  return positive ? 1 : -1;
}

class ArenaScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private blocks: Phaser.GameObjects.Rectangle[] = [];
  private sourceWidth = 0;
  private sourceHeight = 0;
  private player: Player | null = null;
  private keys: ArenaKeys | null = null;
  private anchorX = 0.5;
  private anchorY = 0.5;
  private worldWidth = 0;
  private worldHeight = 0;

  constructor() {
    super("arena");
  }

  preload() {
    this.load.image(ARENA_FLOOR_KEY, "/arena/arena-floor.jpg");
    (["idle", "walk"] as const).forEach((action) => {
      const sheet = PLAYER_SHEETS[action];
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: PLAYER_CELL_SIZE,
        frameHeight: PLAYER_CELL_SIZE,
      });
    });
  }

  create() {
    const colors = [
      cssColorNumber("--energy-metal", 0x7e95a8),
      cssColorNumber("--energy-fighting", 0xc46a32),
    ];

    this.background = this.add.image(0, 0, ARENA_FLOOR_KEY);
    this.sourceWidth = this.background.width;
    this.sourceHeight = this.background.height;
    this.blocks = colors.map((color) => {
      const block = this.add.rectangle(0, 0, 1, 1, color);
      this.physics.add.existing(block, true);
      return block;
    });

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    const canvas = this.game.canvas;
    canvas.tabIndex = 0;
    const focusCanvas = () => {
      canvas.focus();
    };
    const preventArrowScroll = (event: KeyboardEvent) => {
      if (document.activeElement !== canvas) return;
      if (!ARROW_CODES.has(event.code)) return;
      event.preventDefault();
    };
    const followMarker = () => {
      if (this.player) syncPlayerMarker(this.player);
    };
    this.input.on(Phaser.Input.Events.POINTER_DOWN, focusCanvas);
    window.addEventListener("keydown", preventArrowScroll);
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, followMarker);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, focusCanvas);
      window.removeEventListener("keydown", preventArrowScroll);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, followMarker);
    });

    this.keys = this.bindKeys();
    this.layout();
    const bounds = this.physics.world.bounds;
    this.player = createPlayer(this, bounds.centerX, bounds.centerY);
    this.physics.add.collider(this.player.sprite, this.blocks);
    this.cameras.main.startFollow(this.player.sprite);
    this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
  }

  update() {
    if (!this.player || !this.keys) return;
    const x = axis(
      this.keys.left.isDown || this.keys.A.isDown,
      this.keys.right.isDown || this.keys.D.isDown,
    );
    const y = axis(
      this.keys.up.isDown || this.keys.W.isDown,
      this.keys.down.isDown || this.keys.S.isDown,
    );
    updatePlayer(this.player, x, y);
  }

  private bindKeys() {
    const keyboard = this.input.keyboard;
    if (!keyboard) return null;
    return keyboard.addKeys(
      {
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
      },
      false,
    ) as ArenaKeys;
  }

  private layout() {
    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;
    const world = arenaWorldSize(
      viewWidth,
      viewHeight,
      this.sourceWidth,
      this.sourceHeight,
    );
    if (world.width === 0 || world.height === 0) return;

    if (this.player && this.worldWidth > 0 && this.worldHeight > 0) {
      this.anchorX = this.player.sprite.x / this.worldWidth;
      this.anchorY = this.player.sprite.y / this.worldHeight;
    }

    this.background
      .setPosition(world.width / 2, world.height / 2)
      .setDisplaySize(world.width, world.height);
    this.physics.world.setBounds(
      ARENA_WALK_INSET.left,
      ARENA_WALK_INSET.top,
      Math.max(world.width - ARENA_WALK_INSET.left - ARENA_WALK_INSET.right, 1),
      Math.max(
        world.height - ARENA_WALK_INSET.top - ARENA_WALK_INSET.bottom,
        1,
      ),
    );
    this.cameras.main.setBounds(0, 0, world.width, world.height);
    this.worldWidth = world.width;
    this.worldHeight = world.height;

    this.blocks.forEach((block, index) => {
      const spec = BLOCKS[index];
      block
        .setPosition(world.width * spec.x, world.height * spec.y)
        .setSize(spec.width, spec.height);
      if (block.body instanceof Phaser.Physics.Arcade.StaticBody)
        block.body.updateFromGameObject();
    });

    if (!this.player) return;
    placePlayer(
      this.player,
      world.width * this.anchorX,
      world.height * this.anchorY,
    );
    this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
  }
}

export { ArenaScene };
