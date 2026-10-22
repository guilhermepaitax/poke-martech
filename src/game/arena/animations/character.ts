import {
  applyNearestCharacterFilter,
  fighterSheet,
  fighterSheetKey,
} from "@/game/arena/assets/catalog";
import { EIGHT_WAY_ROWS, type ArenaFighter, type FighterAction } from "@/lib/arena/fighter";
import type { Facing } from "@/lib/arena/movement";
import Phaser from "phaser";

const CHARACTER_DISPLAY_SIZE = 96;

const CLIP = {
  idle: { sheet: "idle", frameRate: 8, repeat: -1 },
  walk: { sheet: "walk", frameRate: 12, repeat: -1 },
  dash: { sheet: "walk", frameRate: 24, repeat: -1 },
  attack: { sheet: "attack", frameRate: 12, repeat: 0 },
  shoot: { sheet: "shoot", frameRate: 12, repeat: 0 },
  hurt: { sheet: "hurt", frameRate: 12, repeat: 0 },
} as const satisfies Record<
  string,
  {
    sheet: FighterAction;
    frameRate: number;
    repeat: number;
  }
>;

type CharacterClip = keyof typeof CLIP;

const FACINGS = Object.keys(EIGHT_WAY_ROWS) as Facing[];

function characterAnimationKey(fighter: ArenaFighter, action: CharacterClip, facing: Facing) {
  return `${fighter.id}-${action}-${facing}`;
}

function characterDisplaySize(fighter: ArenaFighter) {
  return fighter.tuning.displaySize ?? CHARACTER_DISPLAY_SIZE;
}

function characterFrameStart(fighter: ArenaFighter, action: CharacterClip, facing: Facing) {
  const sheet = fighterSheet(fighter, CLIP[action].sheet);
  return sheet.rows[facing] * fighter.sprite.columns;
}

function registerCharacterAnimations(scene: Phaser.Scene, fighter: ArenaFighter) {
  applyNearestCharacterFilter(scene, fighter);
  (Object.keys(CLIP) as CharacterClip[]).forEach((action) => {
    const clip = CLIP[action];
    const sheet = fighterSheet(fighter, clip.sheet);
    FACINGS.forEach((direction) => {
      const key = characterAnimationKey(fighter, action, direction);
      if (scene.anims.exists(key)) return;
      const start = characterFrameStart(fighter, action, direction);
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(fighterSheetKey(fighter, clip.sheet), {
          start,
          end: start + sheet.frames - 1,
        }),
        frameRate: sheet.frameRate ?? clip.frameRate,
        repeat: clip.repeat,
      });
    });
  });
}

function playClip(sprite: Phaser.GameObjects.Sprite, key: string, size = CHARACTER_DISPLAY_SIZE) {
  sprite.play(key, true);
  sprite.setDisplaySize(size, size);
}

export {
  CHARACTER_DISPLAY_SIZE,
  characterAnimationKey,
  characterDisplaySize,
  characterFrameStart,
  playClip,
  registerCharacterAnimations,
};
export type { CharacterClip };
