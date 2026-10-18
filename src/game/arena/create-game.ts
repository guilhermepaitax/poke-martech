import Phaser from "phaser";
import { cssColor } from "@/game/arena/css-color";
import { ArenaScene } from "@/game/arena/scenes/arena-scene";

function createArenaGame(parent: HTMLElement): Phaser.Game {
  const width = Math.max(parent.clientWidth, 1);
  const height = Math.max(parent.clientHeight, 1);

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: cssColor("--background", "#f3f7f4"),
    banner: false,
    autoFocus: false,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        width,
        height,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width,
      height,
    },
    scene: ArenaScene,
  });
}

export { createArenaGame };
