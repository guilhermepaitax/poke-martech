import {
  CHARACTER_SHEETS,
  applyNearestCharacterFilter,
  type CharacterAction,
} from "@/game/arena/assets/catalog";
import { cardinalFacing, type CardinalFacing, type Facing } from "@/lib/arena/movement";
import Phaser from "phaser";

const SHEET_COLUMNS = 8;
const CHARACTER_DISPLAY_SIZE = 96;

const EIGHT_WAY_ROW = {
  south: 1,
  "south-east": 2,
  east: 3,
  "north-east": 4,
  north: 5,
  "north-west": 6,
  west: 7,
  "south-west": 8,
} as const;

const CARDINAL_ROW = {
  south: 1,
  east: 2,
  north: 3,
  west: 4,
} as const;

const CLIP = {
  idle: { frameRate: 8, frames: SHEET_COLUMNS, repeat: -1, eightWay: true },
  walk: { frameRate: 12, frames: SHEET_COLUMNS, repeat: -1, eightWay: true },
  attack: { frameRate: 12, frames: 3, repeat: 0, eightWay: false },
  hurt: { frameRate: 12, frames: 6, repeat: 0, eightWay: false },
} as const;

function usesEightWay(action: CharacterAction) {
  return CLIP[action].eightWay;
}

function characterAnimationKey(action: CharacterAction, facing: Facing) {
  const direction = usesEightWay(action) ? facing : cardinalFacing(facing);
  return `antoniomander-${action}-${direction}`;
}

function characterFrameStart(action: CharacterAction, facing: Facing) {
  const row = usesEightWay(action)
    ? EIGHT_WAY_ROW[facing]
    : CARDINAL_ROW[cardinalFacing(facing)];
  return row * SHEET_COLUMNS;
}

function registerCharacterAnimations(scene: Phaser.Scene) {
  applyNearestCharacterFilter(scene);
  (Object.keys(CHARACTER_SHEETS) as CharacterAction[]).forEach((action) => {
    const sheet = CHARACTER_SHEETS[action];
    const clip = CLIP[action];
    const directions: Facing[] = clip.eightWay
      ? (Object.keys(EIGHT_WAY_ROW) as Facing[])
      : (Object.keys(CARDINAL_ROW) as CardinalFacing[]);
    directions.forEach((direction) => {
      const key = characterAnimationKey(action, direction);
      if (scene.anims.exists(key)) return;
      const start = characterFrameStart(action, direction);
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(sheet.key, {
          start,
          end: start + clip.frames - 1,
        }),
        frameRate: clip.frameRate,
        repeat: clip.repeat,
      });
    });
  });
}

function playClip(sprite: Phaser.GameObjects.Sprite, key: string) {
  sprite.play(key, true);
  sprite.setDisplaySize(CHARACTER_DISPLAY_SIZE, CHARACTER_DISPLAY_SIZE);
}

export {
  characterAnimationKey,
  characterFrameStart,
  playClip,
  registerCharacterAnimations,
};
