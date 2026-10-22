import type { ArenaFighter, FighterAction } from "@/lib/arena/fighter";
import Phaser from "phaser";

const FIGHTER_ACTIONS: readonly FighterAction[] = ["idle", "walk", "attack", "hurt"];

const ARENA_FLOOR = {
  key: "arena-floor",
  path: "/arena/backgrounds/floor.jpg",
} as const;

const ARENA_AUDIO = {
  appear: { key: "arena-appear", path: "/arena/audio/appear.wav" },
  laser: { key: "arena-laser", path: "/arena/audio/laser.wav" },
  hit: { key: "arena-hit", path: "/arena/audio/hit.wav" },
  dash: { key: "arena-dash", path: "/arena/audio/dash.wav" },
  explosion: { key: "arena-explosion", path: "/arena/audio/explosion.wav" },
} as const;

type ArenaCue = keyof typeof ARENA_AUDIO;

function fighterSheetKey(fighter: ArenaFighter, action: FighterAction) {
  return `${fighter.id}-${action}`;
}

function preloadArenaAssets(scene: Phaser.Scene, fighters: readonly ArenaFighter[]) {
  scene.load.image(ARENA_FLOOR.key, ARENA_FLOOR.path);
  fighters.forEach((fighter) => {
    FIGHTER_ACTIONS.forEach((action) => {
      const key = fighterSheetKey(fighter, action);
      if (scene.textures.exists(key)) return;
      scene.load.spritesheet(key, fighter.sprite.sheets[action].path, {
        frameWidth: fighter.sprite.cellSize,
        frameHeight: fighter.sprite.cellSize,
      });
    });
  });
  (Object.keys(ARENA_AUDIO) as ArenaCue[]).forEach((cue) => {
    const clip = ARENA_AUDIO[cue];
    scene.load.audio(clip.key, clip.path);
  });
}

function applyNearestCharacterFilter(scene: Phaser.Scene, fighter: ArenaFighter) {
  FIGHTER_ACTIONS.forEach((action) => {
    const key = fighterSheetKey(fighter, action);
    if (!scene.textures.exists(key)) return;
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  });
}

export {
  ARENA_AUDIO,
  ARENA_FLOOR,
  applyNearestCharacterFilter,
  fighterSheetKey,
  preloadArenaAssets,
};
export type { ArenaCue };
