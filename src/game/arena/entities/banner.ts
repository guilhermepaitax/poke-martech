import { titleFont } from "@/game/arena/entities/marker";
import Phaser from "phaser";

const BANNER_DEPTH = 30;
const BANNER_Y = 0.3;
const ENTER_MS = 240;
const HOLD_MS = 640;
const EXIT_MS = 220;
const SLIDE_X = 90;
const PANEL_PAD_X = 28;
const PANEL_PAD_Y = 10;
const PANEL_SLANT = 0.32;
const PANEL_FILL = 0x150e27;
const PANEL_ALPHA = 0.92;
const SHADOW_ALPHA = 0.55;
const SHADOW_OFFSET = 6;
const STRIPE_HEIGHT = 5;
const TAB_PAD_X = 10;
const TAB_SLANT = 8;
const INK = "#f7f3ff";
const INK_COLOR = 0xf7f3ff;
const TAB_INK = "#150e27";
const SHADOW_INK = "#000000";

type BannerTone = "critical" | "charge" | "max" | "super" | "ko" | "guard";

type BannerStyle = {
  tone: number;
  accent: string;
  // Rótulo da aba branca, no mesmo formato das seções da tela de escolha.
  tab: string;
  size: number;
};

const BANNER_STYLE: Record<BannerTone, BannerStyle> = {
  critical: { tone: 0xffd23a, accent: "#ffd23a", tab: "Golpe", size: 40 },
  charge: { tone: 0xff7a2a, accent: "#ff7a2a", tab: "Carga", size: 32 },
  max: { tone: 0xc45cff, accent: "#c45cff", tab: "Carga", size: 36 },
  super: { tone: 0xff4ad8, accent: "#ff4ad8", tab: "Especial", size: 40 },
  ko: { tone: 0xc6f135, accent: "#c6f135", tab: "Fim de luta", size: 60 },
  guard: { tone: 0x8fd8ff, accent: "#8fd8ff", tab: "Defesa", size: 34 },
};

type Banner = {
  root: Phaser.GameObjects.Container;
};

type BannerBucket = {
  current: Banner | null;
};

// Paralelogramo inclinado para a direita; `fromY`/`toY` recortam uma faixa horizontal dele.
function slantedBand(width: number, height: number, slant: number, fromY: number, toY: number) {
  const halfW = width / 2;
  const halfH = height / 2;
  const leftAt = (y: number) => -halfW + (slant * (halfH - y)) / height;
  const rightAt = (y: number) => halfW - (slant * (y + halfH)) / height;
  return [
    new Phaser.Math.Vector2(leftAt(fromY), fromY),
    new Phaser.Math.Vector2(rightAt(fromY), fromY),
    new Phaser.Math.Vector2(rightAt(toY), toY),
    new Phaser.Math.Vector2(leftAt(toY), toY),
  ];
}

function paintPanel(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  tone: number,
) {
  const slant = height * PANEL_SLANT;
  const halfH = height / 2;
  graphics.clear();
  graphics.fillStyle(0x000000, SHADOW_ALPHA);
  graphics.fillPoints(
    slantedBand(width, height, slant, -halfH, halfH).map((point) =>
      point.add({ x: 0, y: SHADOW_OFFSET }),
    ),
    true,
  );
  graphics.fillStyle(PANEL_FILL, PANEL_ALPHA);
  graphics.fillPoints(slantedBand(width, height, slant, -halfH, halfH), true);
  graphics.fillStyle(INK_COLOR, 1);
  graphics.fillPoints(slantedBand(width, height, slant, -halfH, -halfH + 2), true);
  graphics.fillStyle(tone, 1);
  graphics.fillPoints(
    slantedBand(width, height, slant, halfH - STRIPE_HEIGHT, halfH),
    true,
  );
}

function paintTab(graphics: Phaser.GameObjects.Graphics, width: number, height: number) {
  graphics.clear();
  graphics.fillStyle(INK_COLOR, 1);
  graphics.fillPoints(
    [
      new Phaser.Math.Vector2(0, 0),
      new Phaser.Math.Vector2(width, 0),
      new Phaser.Math.Vector2(width - TAB_SLANT, height),
      new Phaser.Math.Vector2(0, height),
    ],
    true,
  );
}

function splitLabel(label: string) {
  const index = label.lastIndexOf(" ");
  if (index <= 0) return { head: "", tail: label };
  return { head: label.slice(0, index), tail: label.slice(index + 1) };
}

function destroyBanner(scene: Phaser.Scene, banner: Banner) {
  scene.tweens.killTweensOf(banner.root);
  for (const child of banner.root.list) {
    scene.tweens.killTweensOf(child);
    if (child instanceof Phaser.GameObjects.Container) scene.tweens.killTweensOf(child.list);
  }
  if (banner.root.scene) banner.root.destroy();
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
  const banner: Banner = { root };
  bucket.current = banner;

  const { head, tail } = splitLabel(label);
  const textStyle = {
    fontFamily: titleFont(),
    fontStyle: "italic 900",
    fontSize: `${size}px`,
  };
  const shadow = { offsetX: 0, offsetY: Math.max(2, Math.round(size / 12)), color: SHADOW_INK, fill: true };
  const headText = scene.add
    .text(0, 0, head.toUpperCase(), { ...textStyle, color: INK, shadow })
    .setOrigin(0, 0.5);
  const tailText = scene.add
    .text(0, 0, tail.toUpperCase(), { ...textStyle, color: style.accent, shadow })
    .setOrigin(0, 0.5);
  const gap = head ? size * 0.3 : 0;
  const lineWidth = headText.width + gap + tailText.width;
  headText.setX(-lineWidth / 2);
  tailText.setX(-lineWidth / 2 + headText.width + gap);

  const panelHeight = size + PANEL_PAD_Y * 2;
  const panelWidth = lineWidth + PANEL_PAD_X * 2 + panelHeight * PANEL_SLANT;
  const panel = scene.add.graphics();
  paintPanel(panel, panelWidth, panelHeight, style.tone);

  const tabSize = Math.max(10, Math.round(size * 0.3));
  const tabText = scene.add
    .text(0, 0, `${style.tab.toUpperCase()}_`, {
      fontFamily: titleFont(),
      fontStyle: "italic 900",
      fontSize: `${tabSize}px`,
      color: TAB_INK,
    })
    .setOrigin(0, 0.5);
  const tabHeight = tabSize + 6;
  const tabWidth = tabText.width + TAB_PAD_X * 2 + TAB_SLANT;
  const tabX = -panelWidth / 2 + panelHeight * PANEL_SLANT;
  const tabY = -panelHeight / 2 - tabHeight;
  const tab = scene.add.graphics().setPosition(tabX, tabY);
  paintTab(tab, tabWidth, tabHeight);
  tabText.setPosition(tabX + TAB_PAD_X, tabY + tabHeight / 2);

  const body = scene.add.container(0, 0, [panel, tab, tabText, headText, tailText]);
  root.add(body);

  body.setX(-SLIDE_X).setAlpha(0);
  scene.tweens.add({
    targets: body,
    x: 0,
    alpha: 1,
    duration: ENTER_MS,
    ease: "Back.easeOut",
    easeParams: [1.6],
  });
  tab.setScale(0, 1);
  scene.tweens.add({
    targets: tab,
    scaleX: 1,
    delay: ENTER_MS * 0.5,
    duration: 180,
    ease: "Cubic.easeOut",
  });
  tabText.setAlpha(0);
  scene.tweens.add({ targets: tabText, alpha: 1, delay: ENTER_MS * 0.5 + 120, duration: 120 });
  scene.tweens.add({
    targets: body,
    x: SLIDE_X,
    alpha: 0,
    delay: ENTER_MS + HOLD_MS,
    duration: EXIT_MS,
    ease: "Cubic.easeIn",
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
