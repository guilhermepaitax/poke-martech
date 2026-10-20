import Phaser from "phaser";

const FX_TEXTURES = {
  glow: "fx-glow",
  spark: "fx-spark",
  star: "fx-star",
  scorch: "fx-scorch",
  streak: "fx-streak",
} as const;

const GLOW_SIZE = 64;
const SPARK_SIZE = 8;
const STAR_SIZE = 64;
const STAR_POINTS = 8;
const SCORCH_SIZE = 128;
const STREAK_WIDTH = 28;
const STREAK_HEIGHT = 4;

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
}

export { createFxTextures, FX_TEXTURES };
