import Phaser from "phaser";

const SPRITE_CELL_SIZE = 128;

const ARENA_FLOOR = {
  key: "arena-floor",
  path: "/arena/backgrounds/floor.jpg",
} as const;

const CHARACTER_SHEETS = {
  idle: {
    key: "antoniomander-idle",
    path: "/arena/characters/antoniomander/idle.png",
  },
  walk: {
    key: "antoniomander-walk",
    path: "/arena/characters/antoniomander/walk.png",
  },
  attack: {
    key: "antoniomander-attack",
    path: "/arena/characters/antoniomander/attack.png",
  },
  hurt: {
    key: "antoniomander-hurt",
    path: "/arena/characters/antoniomander/hurt.png",
  },
} as const;

const ARENA_AUDIO = {
  appear: { key: "arena-appear", path: "/arena/audio/appear.wav" },
  laser: { key: "arena-laser", path: "/arena/audio/laser.wav" },
  hit: { key: "arena-hit", path: "/arena/audio/hit.wav" },
} as const;

type CharacterAction = keyof typeof CHARACTER_SHEETS;
type ArenaCue = keyof typeof ARENA_AUDIO;

function preloadArenaAssets(scene: Phaser.Scene) {
  scene.load.image(ARENA_FLOOR.key, ARENA_FLOOR.path);
  (Object.keys(CHARACTER_SHEETS) as CharacterAction[]).forEach((action) => {
    const sheet = CHARACTER_SHEETS[action];
    scene.load.spritesheet(sheet.key, sheet.path, {
      frameWidth: SPRITE_CELL_SIZE,
      frameHeight: SPRITE_CELL_SIZE,
    });
  });
  (Object.keys(ARENA_AUDIO) as ArenaCue[]).forEach((cue) => {
    const clip = ARENA_AUDIO[cue];
    scene.load.audio(clip.key, clip.path);
  });
}

function applyNearestCharacterFilter(scene: Phaser.Scene) {
  (Object.keys(CHARACTER_SHEETS) as CharacterAction[]).forEach((action) => {
    const key = CHARACTER_SHEETS[action].key;
    if (!scene.textures.exists(key)) return;
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  });
}

export {
  ARENA_AUDIO,
  ARENA_FLOOR,
  CHARACTER_SHEETS,
  preloadArenaAssets,
  SPRITE_CELL_SIZE,
  applyNearestCharacterFilter,
};
export type { ArenaCue, CharacterAction };
