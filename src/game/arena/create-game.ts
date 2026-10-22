import { ARENA_EVENTS } from "@/game/arena/arena-events";
import { cssColor } from "@/game/arena/css-color";
import { setPixelFont, setTitleFont } from "@/game/arena/entities/marker";
import { ArenaScene } from "@/game/arena/scenes/arena-scene";
import { arenaAudioContext } from "@/game/arena/unlock-audio";
import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import type { ArenaOutcome } from "@/lib/arena/outcome";
import type { ArenaHudState, ArenaSnapshot } from "@/lib/arena/snapshot";
import Phaser from "phaser";

const FONT_TIMEOUT_MS = 1500;

async function loadArenaFonts(parent: HTMLElement) {
  const style = getComputedStyle(parent);
  const pixel = style.getPropertyValue("--font-pixel").trim();
  const title = style.getPropertyValue("--font-title").trim();
  setPixelFont(pixel);
  setTitleFont(title);
  if (!document.fonts) return;
  const loads = [
    pixel ? `16px ${pixel}` : null,
    title ? `italic 900 32px ${title}` : null,
  ]
    .filter((font) => font !== null)
    .map((font) => document.fonts.load(font).catch(() => undefined));
  await Promise.race([
    Promise.all(loads),
    new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS)),
  ]);
}

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
    // Phaser lê `config.audio.noAudio` sem checar; `undefined` derruba o boot.
    audio: audioContext ? { context: audioContext } : {},
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
  onSnapshot: (listener: (snapshot: ArenaSnapshot) => void) => () => void;
  onHud: (listener: (hud: ArenaHudState) => void) => () => void;
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
    onSnapshot: (listener) => {
      game.events.on(ARENA_EVENTS.snapshot, listener);
      const current: unknown = game.registry.get("snapshot");
      if (current) listener(current as ArenaSnapshot);
      return () => {
        game.events.off(ARENA_EVENTS.snapshot, listener);
      };
    },
    onHud: (listener) => {
      game.events.on(ARENA_EVENTS.hud, listener);
      const current: unknown = game.registry.get("hud");
      if (current) listener(current as ArenaHudState);
      return () => {
        game.events.off(ARENA_EVENTS.hud, listener);
      };
    },
  };
}

export { arenaControls, createArenaGame, loadArenaFonts };
export type { ArenaControls };
