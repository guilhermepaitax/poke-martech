import { ARENA_EVENTS } from "@/game/arena/arena-events";
import { cssColor } from "@/game/arena/css-color";
import { ArenaScene } from "@/game/arena/scenes/arena-scene";
import { arenaAudioContext } from "@/game/arena/unlock-audio";
import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import type { ArenaOutcome } from "@/lib/arena/outcome";
import Phaser from "phaser";

function createArenaGame(
  parent: HTMLElement,
  matchup: ArenaMatchup,
  difficulty: ArenaDifficulty,
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
        game.registry.set("difficulty", difficulty);
      },
    },
    scene: ArenaScene,
  });
}

type ArenaControls = {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  onOutcome: (
    listener: (outcome: Exclude<ArenaOutcome, "ongoing">) => void,
  ) => () => void;
};

function arenaScene(game: Phaser.Game) {
  const scene = game.scene.getScene("arena");
  return scene instanceof ArenaScene ? scene : null;
}

function arenaControls(game: Phaser.Game): ArenaControls {
  return {
    pause: () => arenaScene(game)?.pauseMatch(),
    resume: () => arenaScene(game)?.resumeMatch(),
    restart: () => arenaScene(game)?.restartMatch(),
    onOutcome: (listener) => {
      game.events.on(ARENA_EVENTS.outcome, listener);
      return () => {
        game.events.off(ARENA_EVENTS.outcome, listener);
      };
    },
  };
}

export { arenaControls, createArenaGame };
export type { ArenaControls };
