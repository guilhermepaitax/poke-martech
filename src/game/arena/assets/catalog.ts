import type { ArenaFighter, FighterAction, FighterSheet } from "@/lib/arena/fighter";
import Phaser from "phaser";

const FIGHTER_ACTIONS: readonly FighterAction[] = ["idle", "walk", "attack", "shoot", "hurt", "defend"];

// Folha usada quando o lutador não tem a própria.
const SHEET_FALLBACK: Partial<Record<FighterAction, FighterAction>> = {
  shoot: "attack",
  defend: "idle",
};

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
  bone: { key: "arena-bone", path: "/arena/audio/bone.wav" },
} as const;

type ArenaCue = keyof typeof ARENA_AUDIO;

// Ação sem folha própria (`shoot` ou `defend`) cai na folha de reserva.
function fighterSheetAction(fighter: ArenaFighter, action: FighterAction): FighterAction {
  if (fighter.sprite.sheets[action]) return action;
  return SHEET_FALLBACK[action] ?? "idle";
}

function fighterSheet(fighter: ArenaFighter, action: FighterAction): FighterSheet {
  const sheets = fighter.sprite.sheets;
  return sheets[action] ?? sheets[fighterSheetAction(fighter, action)] ?? sheets.idle;
}

function fighterSheetKey(fighter: ArenaFighter, action: FighterAction) {
  return `${fighter.id}-${fighterSheetAction(fighter, action)}`;
}

function preloadArenaAssets(scene: Phaser.Scene, fighters: readonly ArenaFighter[]) {
  scene.load.image(ARENA_FLOOR.key, ARENA_FLOOR.path);
  fighters.forEach((fighter) => {
    FIGHTER_ACTIONS.forEach((action) => {
      if (fighterSheetAction(fighter, action) !== action) return;
      const key = fighterSheetKey(fighter, action);
      if (scene.textures.exists(key)) return;
      scene.load.spritesheet(key, fighterSheet(fighter, action).path, {
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
  fighterSheet,
  fighterSheetKey,
  preloadArenaAssets,
};
export type { ArenaCue };
