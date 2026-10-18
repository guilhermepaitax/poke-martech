import Phaser from "phaser";
import { cssColorNumber } from "@/game/arena/css-color";
import { arenaWorldSize } from "@/lib/arena/world-size";

const ARENA_FLOOR_KEY = "arena-floor";

const BLOCKS = [
  { x: 0.28, y: 0.34, width: 160, height: 36 },
  { x: 0.68, y: 0.68, width: 48, height: 140 },
] as const;

class ArenaScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private blocks: Phaser.GameObjects.Rectangle[] = [];
  private sourceWidth = 0;
  private sourceHeight = 0;

  constructor() {
    super("arena");
  }

  preload() {
    this.load.image(ARENA_FLOOR_KEY, "/arena/arena-floor.jpg");
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
    this.layout();
  }

  private layout() {
    const viewWidth = this.scale.width;
    const viewHeight = this.scale.height;
    const world = arenaWorldSize(viewWidth, viewHeight, this.sourceWidth, this.sourceHeight);
    if (world.width === 0 || world.height === 0) return;

    this.background.setPosition(world.width / 2, world.height / 2).setDisplaySize(world.width, world.height);
    this.physics.world.setBounds(0, 0, world.width, world.height);
    this.cameras.main.setBounds(0, 0, world.width, world.height);
    this.cameras.main.centerOn(world.width / 2, world.height / 2);

    this.blocks.forEach((block, index) => {
      const spec = BLOCKS[index];
      block
        .setPosition(world.width * spec.x, world.height * spec.y)
        .setSize(spec.width, spec.height);
      if ("refreshBody" in block && typeof block.refreshBody === "function") block.refreshBody();
    });
  }
}

export { ArenaScene };
