import Phaser from "phaser";

const FX_TEXTURES = {
  glow: "fx-glow",
  spark: "fx-spark",
  star: "fx-star",
  scorch: "fx-scorch",
  streak: "fx-streak",
  pixel: "fx-pixel",
  bone: "fx-bone",
} as const;

const GLOW_SIZE = 64;
const SPARK_SIZE = 8;
const STAR_SIZE = 64;
const STAR_POINTS = 8;
const SCORCH_SIZE = 128;
const STREAK_WIDTH = 28;
const STREAK_HEIGHT = 4;
const PIXEL_SIZE = 4;
const BONE_WIDTH = 36;
const BONE_HEIGHT = 14;

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

function starPoints(size: number, points: number) {
  const center = size / 2;
  const outer = center;
  const inner = center * 0.42;
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

function paintBone(graphics: Phaser.GameObjects.Graphics, color: number, grow: number) {
  const knob = BONE_HEIGHT / 4 + grow;
  const shaft = BONE_HEIGHT / 5 + grow;
  const middle = BONE_HEIGHT / 2;
  const ends = [BONE_HEIGHT / 4 + 1, BONE_WIDTH - BONE_HEIGHT / 4 - 1];
  graphics.fillStyle(color, 1);
  graphics.fillRect(ends[0] ?? 0, middle - shaft, (ends[1] ?? 0) - (ends[0] ?? 0), shaft * 2);
  ends.forEach((x) => {
    graphics.fillCircle(x, middle - knob, knob);
    graphics.fillCircle(x, middle + knob, knob);
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
  bake(scene, FX_TEXTURES.bone, BONE_WIDTH, BONE_HEIGHT, (graphics) => {
    paintBone(graphics, 0x3a2a1c, 0);
    paintBone(graphics, 0xf4ecd8, -1.4);
  });
  scene.textures.get(FX_TEXTURES.pixel).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

export { createFxTextures, FX_TEXTURES };
