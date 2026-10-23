import Phaser from "phaser";

const FX_TEXTURES = {
  glow: "fx-glow",
  spark: "fx-spark",
  star: "fx-star",
  scorch: "fx-scorch",
  streak: "fx-streak",
  pixel: "fx-pixel",
  bone: "fx-bone",
  boneCharged: "fx-bone-charged",
  swift: "fx-swift",
  swiftCharged: "fx-swift-charged",
  bubble: "fx-bubble",
  bubbleAlt: "fx-bubble-alt",
  bubbleCharged: "fx-bubble-charged",
  bubbleChargedAlt: "fx-bubble-charged-alt",
  bubblePop: "fx-bubble-pop",
  orb: "fx-orb",
  orbAlt: "fx-orb-alt",
  orbCharged: "fx-orb-charged",
  orbChargedAlt: "fx-orb-charged-alt",
  shards: "fx-shards",
} as const;

// Pixel art 12x12 das bolhas: `#` contorno, `.` miolo translúcido,
// `w` brilho, `o` reflexo de baixo. Dois quadros alternam (normal/achatada).
const BUBBLE_ART = [
  "    ####    ",
  "  ##....##  ",
  " #.ww.....# ",
  " #w.......# ",
  "#..........#",
  "#..........#",
  "#..........#",
  "#.........o#",
  " #.......o# ",
  " #......o.# ",
  "  ##....##  ",
  "    ####    ",
];

const BUBBLE_ART_ALT = [
  "            ",
  "   ######   ",
  " ##.ww...## ",
  "#.w........#",
  "#..........#",
  "#..........#",
  "#..........#",
  "#........o.#",
  " ##....o.## ",
  "   ######   ",
  "            ",
  "            ",
];

// Anel quebrado do estouro, branco para receber tint.
const BUBBLE_POP_ART = [
  "     ##     ",
  "  #      #  ",
  " #        # ",
  "            ",
  "            ",
  "#          #",
  "#          #",
  "            ",
  "            ",
  " #        # ",
  "  #      #  ",
  "     ##     ",
];

// Pixel art 12x12 da bola de energia: `#` contorno, `.` casca, `c` núcleo,
// `w` brilho. O quadro alternativo encolhe a casca e acende o núcleo (pulso).
const ORB_ART = [
  "    ####    ",
  "  ##....##  ",
  " #..cccc..# ",
  " #.cwwccc.# ",
  "#..cwcccc..#",
  "#.cccccccc.#",
  "#.cccccccc.#",
  "#..cccccc..#",
  " #..cccc..# ",
  " #........# ",
  "  ##....##  ",
  "    ####    ",
];

const ORB_ART_ALT = [
  "            ",
  "    ####    ",
  "  ##cccc##  ",
  "  #cwwccc#  ",
  " #cwwccccc# ",
  " #cwcccccc# ",
  " #cccccccc# ",
  " #.cccccc.# ",
  "  #.cccc.#  ",
  "  ##....##  ",
  "    ####    ",
  "            ",
];

// Estilhaços genéricos de impacto (bola, estrela, osso), brancos para receber tint.
const SHARDS_ART = [
  "#    ##    #",
  " #        # ",
  "            ",
  "            ",
  "            ",
  "#          #",
  "#          #",
  "            ",
  "            ",
  "            ",
  " #        # ",
  "#    ##    #",
];

// Osso 22x10 do Ossomerang: `#` contorno, `w` osso, `s` sombra de baixo.
const BONE_ART = [
  " ####            #### ",
  "#wwww#          #wwww#",
  "#wwww#          #wwww#",
  " #www############www# ",
  "  #wwwwwwwwwwwwwwww#  ",
  "  #wwwwwwwwwwwwwwss#  ",
  " #wss############sss# ",
  "#wsss#          #ssss#",
  "#ssss#          #ssss#",
  " ####            #### ",
];

// Estrela 13x13 do Meteoro: `#` contorno, `w` miolo, `o` sombra, `c` brilho.
const SWIFT_ART = [
  "      #      ",
  "     #c#     ",
  "     #w#     ",
  "    #www#    ",
  "#####wcw#####",
  " #wwwwwwwww# ",
  "  #wwwwwww#  ",
  "   #wwwwo#   ",
  "   #wwooo#   ",
  "  #woo#ooo#  ",
  "  #oo# #oo#  ",
  " #o#     #o# ",
  " ##       ## ",
];

type PixelPalette = Record<string, { color: number; alpha: number }>;

const WATER_PALETTE: PixelPalette = {
  "#": { color: 0x1f6fc4, alpha: 1 },
  ".": { color: 0x9fdcff, alpha: 0.38 },
  w: { color: 0xffffff, alpha: 1 },
  o: { color: 0xd8f3ff, alpha: 0.9 },
};

const CHARGED_PALETTE: PixelPalette = {
  "#": { color: 0x4a4fd8, alpha: 1 },
  ".": { color: 0xc4ccff, alpha: 0.42 },
  w: { color: 0xffffff, alpha: 1 },
  o: { color: 0xeef0ff, alpha: 0.9 },
};

const GRASS_PALETTE: PixelPalette = {
  "#": { color: 0x0a7a2a, alpha: 1 },
  ".": { color: 0x22e03a, alpha: 1 },
  c: { color: 0xa8ff8a, alpha: 1 },
  w: { color: 0xffffff, alpha: 1 },
};

const GRASS_CHARGED_PALETTE: PixelPalette = {
  "#": { color: 0x00a04a, alpha: 1 },
  ".": { color: 0x3cff2a, alpha: 1 },
  c: { color: 0xd8ffb0, alpha: 1 },
  w: { color: 0xffffff, alpha: 1 },
};

const BONE_PALETTE: PixelPalette = {
  "#": { color: 0x3a2a1c, alpha: 1 },
  w: { color: 0xf4ecd8, alpha: 1 },
  s: { color: 0xc9b08a, alpha: 1 },
};

const BONE_CHARGED_PALETTE: PixelPalette = {
  "#": { color: 0x5a3410, alpha: 1 },
  w: { color: 0xfff6e0, alpha: 1 },
  s: { color: 0xf0c070, alpha: 1 },
};

const SWIFT_PALETTE: PixelPalette = {
  "#": { color: 0xc06a00, alpha: 1 },
  w: { color: 0xfff3a8, alpha: 1 },
  o: { color: 0xffc23a, alpha: 1 },
  c: { color: 0xffffff, alpha: 1 },
};

const SWIFT_CHARGED_PALETTE: PixelPalette = {
  "#": { color: 0x9a2a86, alpha: 1 },
  w: { color: 0xfff0fb, alpha: 1 },
  o: { color: 0xff7ad9, alpha: 1 },
  c: { color: 0xffffff, alpha: 1 },
};

const POP_PALETTE: PixelPalette = {
  "#": { color: 0xffffff, alpha: 1 },
};

const GLOW_SIZE = 64;
const SPARK_SIZE = 8;
const STAR_SIZE = 64;
const STAR_POINTS = 8;
const SCORCH_SIZE = 128;
const STREAK_WIDTH = 28;
const STREAK_HEIGHT = 4;
const PIXEL_SIZE = 4;
// Lado das artes 12x12 (bolha, bola, estilhaços); base do `pixelScale`.
const PIXEL_ART_SIZE = 12;
const SWIFT_ART_SIZE = 13;

function bake(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  paint: (graphics: Phaser.GameObjects.Graphics) => void,
) {
  if (scene.textures.exists(key)) return;
  const graphics = scene.add.graphics();
  paint(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

function paintRadial(
  graphics: Phaser.GameObjects.Graphics,
  size: number,
  color: number,
  steps: number,
  peak: number,
) {
  const center = size / 2;
  for (let step = steps; step >= 1; step -= 1) {
    const ratio = step / steps;
    graphics.fillStyle(color, peak * (1 - ratio) + peak / steps);
    graphics.fillCircle(center, center, center * ratio);
  }
}

function starPoints(size: number, points: number, innerRatio = 0.42) {
  const center = size / 2;
  const outer = center;
  const inner = center * innerRatio;
  const vertices: Phaser.Math.Vector2[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = (Math.PI * index) / points - Math.PI / 2;
    vertices.push(
      new Phaser.Math.Vector2(
        center + Math.cos(angle) * radius,
        center + Math.sin(angle) * radius,
      ),
    );
  }
  return vertices;
}

function paintPixelArt(
  graphics: Phaser.GameObjects.Graphics,
  art: string[],
  palette: PixelPalette,
) {
  art.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const ink = palette[cell];
      if (!ink) return;
      graphics.fillStyle(ink.color, ink.alpha);
      graphics.fillRect(x, y, 1, 1);
    });
  });
}

function createFxTextures(scene: Phaser.Scene) {
  bake(scene, FX_TEXTURES.glow, GLOW_SIZE, GLOW_SIZE, (graphics) => {
    paintRadial(graphics, GLOW_SIZE, 0xffffff, 16, 0.22);
  });
  bake(scene, FX_TEXTURES.spark, SPARK_SIZE, SPARK_SIZE, (graphics) => {
    const half = SPARK_SIZE / 2;
    graphics.fillStyle(0xffffff, 1);
    graphics.fillTriangle(half, 0, SPARK_SIZE, half, half, SPARK_SIZE);
    graphics.fillTriangle(half, 0, 0, half, half, SPARK_SIZE);
  });
  bake(scene, FX_TEXTURES.star, STAR_SIZE, STAR_SIZE, (graphics) => {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillPoints(starPoints(STAR_SIZE, STAR_POINTS), true);
  });
  bake(scene, FX_TEXTURES.scorch, SCORCH_SIZE, SCORCH_SIZE, (graphics) => {
    paintRadial(graphics, SCORCH_SIZE, 0xffffff, 12, 0.5);
  });
  bake(scene, FX_TEXTURES.streak, STREAK_WIDTH, STREAK_HEIGHT, (graphics) => {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillTriangle(0, STREAK_HEIGHT / 2, STREAK_WIDTH, 0, STREAK_WIDTH, STREAK_HEIGHT);
  });
  bake(scene, FX_TEXTURES.pixel, PIXEL_SIZE, PIXEL_SIZE, (graphics) => {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);
  });
  const pixelArt: [string, string[], PixelPalette][] = [
    [FX_TEXTURES.bubble, BUBBLE_ART, WATER_PALETTE],
    [FX_TEXTURES.bubbleAlt, BUBBLE_ART_ALT, WATER_PALETTE],
    [FX_TEXTURES.bubbleCharged, BUBBLE_ART, CHARGED_PALETTE],
    [FX_TEXTURES.bubbleChargedAlt, BUBBLE_ART_ALT, CHARGED_PALETTE],
    [FX_TEXTURES.bubblePop, BUBBLE_POP_ART, POP_PALETTE],
    [FX_TEXTURES.orb, ORB_ART, GRASS_PALETTE],
    [FX_TEXTURES.orbAlt, ORB_ART_ALT, GRASS_PALETTE],
    [FX_TEXTURES.orbCharged, ORB_ART, GRASS_CHARGED_PALETTE],
    [FX_TEXTURES.orbChargedAlt, ORB_ART_ALT, GRASS_CHARGED_PALETTE],
    [FX_TEXTURES.shards, SHARDS_ART, POP_PALETTE],
    [FX_TEXTURES.bone, BONE_ART, BONE_PALETTE],
    [FX_TEXTURES.boneCharged, BONE_ART, BONE_CHARGED_PALETTE],
    [FX_TEXTURES.swift, SWIFT_ART, SWIFT_PALETTE],
    [FX_TEXTURES.swiftCharged, SWIFT_ART, SWIFT_CHARGED_PALETTE],
  ];
  pixelArt.forEach(([key, art, palette]) => {
    bake(scene, key, art[0]?.length ?? 0, art.length, (graphics) => {
      paintPixelArt(graphics, art, palette);
    });
  });
  [FX_TEXTURES.pixel, ...pixelArt.map(([key]) => key)].forEach((key) => {
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  });
}

export { createFxTextures, FX_TEXTURES, PIXEL_ART_SIZE, SWIFT_ART_SIZE };
