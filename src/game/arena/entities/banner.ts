import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { titleFont } from "@/game/arena/entities/marker";
import Phaser from "phaser";

const BANNER_DEPTH = 30;
const BANNER_Y = 0.3;
const ENTER_MS = 280;
const HOLD_MS = 620;
const EXIT_MS = 260;
const RAYS = 12;
const RAY_LENGTH = 240;
const RIBBON_PAD_X = 34;
const RIBBON_PAD_Y = 12;
const RIBBON_SLANT = 0.26;
const RIBBON_TILT = -0.07;
const SHADOW_OFFSET = 8;
const CONFETTI = 14;
const CONFETTI_MS = 700;
const INK = "#173028";
const OUTLINE_COLOR = "#0c1a2e";

type BannerTone = "critical" | "charge" | "max" | "super" | "ko";

type BannerStyle = {
  tone: number;
  accent: string;
  glow: number;
  size: number;
};

const BANNER_STYLE: Record<BannerTone, BannerStyle> = {
  critical: { tone: 0xffc21a, accent: "#ffc21a", glow: 0xff9a1a, size: 40 },
  charge: { tone: 0xff7a2a, accent: "#ff7a2a", glow: 0xff6a1a, size: 32 },
  max: { tone: 0xc45cff, accent: "#c45cff", glow: 0xc45cff, size: 36 },
  super: { tone: 0xff4ad8, accent: "#ff4ad8", glow: 0xff4ad8, size: 40 },
  ko: { tone: 0x3a8cff, accent: "#3a8cff", glow: 0xff3a2a, size: 60 },
};

const CONFETTI_COLORS = [0xffffff, 0xffc21a, 0x6cc0ff, 0xff4ad8];

type Banner = {
  root: Phaser.GameObjects.Container;
  motions: object[];
};

type BannerBucket = {
  current: Banner | null;
};

function addTextGlow(scene: Phaser.Scene, text: Phaser.GameObjects.Text, color: number) {
  if (scene.renderer.type !== Phaser.WEBGL) return null;
  text.enableFilters();
  return text.filters?.external.addGlow(color, 4, 0, 1, false, 10, 10) ?? null;
}

function paintRays(graphics: Phaser.GameObjects.Graphics, color: number) {
  graphics.clear();
  for (let index = 0; index < RAYS; index += 1) {
    const angle = (Math.PI * 2 * index) / RAYS;
    const spread = 0.08;
    graphics.fillStyle(index % 2 === 0 ? 0xffffff : color, index % 2 === 0 ? 0.18 : 0.22);
    graphics.fillTriangle(
      0,
      0,
      Math.cos(angle - spread) * RAY_LENGTH,
      Math.sin(angle - spread) * RAY_LENGTH * 0.6,
      Math.cos(angle + spread) * RAY_LENGTH,
      Math.sin(angle + spread) * RAY_LENGTH * 0.6,
    );
  }
}

function ribbonPoints(width: number, height: number, offset = 0) {
  const halfW = width / 2;
  const halfH = height / 2;
  const slant = height * RIBBON_SLANT * 2;
  return [
    new Phaser.Math.Vector2(-halfW + slant + offset, -halfH + offset),
    new Phaser.Math.Vector2(halfW + offset, -halfH + offset),
    new Phaser.Math.Vector2(halfW - slant + offset, halfH + offset),
    new Phaser.Math.Vector2(-halfW + offset, halfH + offset),
  ];
}

function paintRibbon(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  tone: number,
) {
  graphics.clear();
  graphics.fillStyle(tone, 1);
  graphics.fillPoints(ribbonPoints(width, height, SHADOW_OFFSET), true);
  graphics.fillStyle(0xffffff, 1);
  graphics.fillPoints(ribbonPoints(width, height), true);
}

function splitLabel(label: string) {
  const index = label.lastIndexOf(" ");
  if (index <= 0) return { head: "", tail: label };
  return { head: label.slice(0, index), tail: label.slice(index + 1) };
}

function destroyBanner(scene: Phaser.Scene, banner: Banner) {
  for (const motion of banner.motions) scene.tweens.killTweensOf(motion);
  scene.tweens.killTweensOf(banner.root);
  for (const child of banner.root.list) scene.tweens.killTweensOf(child);
  if (banner.root.scene) banner.root.destroy();
}

function burstConfetti(scene: Phaser.Scene, root: Phaser.GameObjects.Container, spread: number) {
  for (let index = 0; index < CONFETTI; index += 1) {
    const angle = (Math.PI * 2 * index) / CONFETTI + Math.random() * 0.4;
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? 0xffffff;
    const piece = scene.add
      .rectangle(0, 0, 10, 4, color, 1)
      .setRotation(Math.random() * Math.PI);
    root.add(piece);
    const reach = spread * (0.6 + Math.random() * 0.5);
    scene.tweens.add({
      targets: piece,
      x: Math.cos(angle) * reach,
      y: Math.sin(angle) * reach * 0.6,
      rotation: piece.rotation + Math.PI * 3,
      alpha: 0,
      duration: CONFETTI_MS + Math.random() * 200,
      ease: "Cubic.easeOut",
    });
  }
}

function spawnBanner(
  scene: Phaser.Scene,
  bucket: BannerBucket,
  label: string,
  tone: BannerTone,
) {
  if (bucket.current) destroyBanner(scene, bucket.current);
  const style = BANNER_STYLE[tone];
  const width = scene.scale.width;
  const size = Math.round(style.size * Math.min(1, Math.max(width / 900, 0.55)));
  const root = scene.add
    .container(width / 2, scene.scale.height * BANNER_Y)
    .setScrollFactor(0)
    .setDepth(BANNER_DEPTH);
  const banner: Banner = { root, motions: [] };
  bucket.current = banner;

  const halo = scene.add
    .image(0, 0, FX_TEXTURES.glow)
    .setTint(style.glow)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setScale((size * 9) / 64, (size * 3.4) / 64)
    .setAlpha(0.8);
  const rays = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  paintRays(rays, style.tone);

  const { head, tail } = splitLabel(label);
  const textStyle = {
    fontFamily: titleFont(),
    fontStyle: "italic 900",
    fontSize: `${size}px`,
  };
  const headText = scene.add
    .text(0, 0, head.toUpperCase(), { ...textStyle, color: INK })
    .setOrigin(0, 0.5);
  const tailText = scene.add
    .text(0, 0, tail.toUpperCase(), { ...textStyle, color: style.accent })
    .setOrigin(0, 0.5)
    .setStroke(OUTLINE_COLOR, Math.max(3, Math.round(size / 10)));
  const gap = head ? size * 0.3 : 0;
  const lineWidth = headText.width + gap + tailText.width;
  headText.setX(-lineWidth / 2);
  tailText.setX(-lineWidth / 2 + headText.width + gap);
  const words = scene.add.container(0, 0, [headText, tailText]).setRotation(RIBBON_TILT);

  const ribbon = scene.add.graphics().setRotation(RIBBON_TILT);
  paintRibbon(
    ribbon,
    lineWidth + RIBBON_PAD_X * 2 + size * 0.6,
    size + RIBBON_PAD_Y * 2,
    style.tone,
  );
  const star = scene.add
    .image(-lineWidth / 2 - size * 0.4, -size * 0.55, FX_TEXTURES.star)
    .setTint(style.tone)
    .setScale((size * 2) / 64)
    .setRotation(-0.3);

  root.add([halo, rays, star, ribbon, words]);
  burstConfetti(scene, root, lineWidth * 0.9 + size * 2);

  const glow = addTextGlow(scene, tailText, style.glow);
  if (glow) {
    banner.motions.push(glow);
    scene.tweens.add({
      targets: glow,
      outerStrength: 10,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  root.setScale(1.8).setAlpha(0);
  scene.tweens.add({
    targets: root,
    scale: 1,
    alpha: 1,
    duration: ENTER_MS,
    ease: "Back.easeOut",
    easeParams: [2.2],
  });
  star.setScale(0.1);
  scene.tweens.add({
    targets: star,
    scale: (size * 2) / 64,
    rotation: -0.25,
    duration: ENTER_MS + 120,
    ease: "Back.easeOut",
  });
  rays.setScale(0.4);
  scene.tweens.add({ targets: rays, scale: 1, duration: ENTER_MS, ease: "Quad.easeOut" });
  scene.tweens.add({
    targets: rays,
    rotation: Math.PI / 4,
    duration: ENTER_MS + HOLD_MS + EXIT_MS,
  });
  scene.tweens.add({
    targets: halo,
    alpha: 0.45,
    duration: 160,
    yoyo: true,
    repeat: -1,
  });
  scene.tweens.add({
    targets: root,
    scale: 1.2,
    alpha: 0,
    delay: ENTER_MS + HOLD_MS,
    duration: EXIT_MS,
    ease: "Quad.easeIn",
    onComplete: () => {
      if (bucket.current === banner) bucket.current = null;
      destroyBanner(scene, banner);
    },
  });
}

function layoutBanner(scene: Phaser.Scene, bucket: BannerBucket) {
  bucket.current?.root.setPosition(scene.scale.width / 2, scene.scale.height * BANNER_Y);
}

function clearBanner(scene: Phaser.Scene, bucket: BannerBucket) {
  if (bucket.current) destroyBanner(scene, bucket.current);
  bucket.current = null;
}

export { clearBanner, layoutBanner, spawnBanner };
export type { BannerBucket, BannerTone };
