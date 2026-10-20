import { cssColor } from "@/game/arena/css-color";
import { ArenaScene } from "@/game/arena/scenes/arena-scene";
import { arenaAudioContext } from "@/game/arena/unlock-audio";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import Phaser from "phaser";

function createArenaGame(
  parent: HTMLElement,
  matchup: ArenaMatchup,
): Phaser.Game {
  const width = Math.max(parent.clientWidth, 1);
  const height = Math.max(parent.clientHeight, 1);
  const audioContext = arenaAudioContext();

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: cssColor("--background", "#f3f7f4"),
    banner: false,
    autoFocus: false,
    audio: audioContext ? { context: audioContext } : undefined,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        width,
        height,
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width,
      height,
    },
    callbacks: {
      preBoot: (game) => {
        game.registry.set("matchup", matchup);
      },
    },
    scene: ArenaScene,
  });
}

export { createArenaGame };
