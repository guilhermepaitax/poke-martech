import { pixelFont, titleFont } from "@/game/arena/entities/marker";
import type { HitTag } from "@/lib/arena/combat";
import Phaser from "phaser";

const NUMBER_RISE = 30;
const NUMBER_POP_MS = 140;
const NUMBER_HOLD_MS = 350;
const NUMBER_FADE_MS = 300;
const NUMBER_DEPTH = 9;
const NUMBER_JITTER_X = 10;
const LABEL_GAP_Y = 20;
const LABEL_LINE_Y = 17;
const LABEL_DELAY_MS = 60;
const LABEL_POP_MS = 120;

const NUMBER_COLOR = "#ffffff";
const CRIT_COLOR = "#ffd23a";
const CHARGED_COLOR = "#f6a8ff";
const OUTLINE_COLOR = "#1a120c";
const LABEL_PANEL = "rgba(21, 14, 39, 0.9)";

const TAG_COLOR: Record<HitTag, string> = {
  critical: CRIT_COLOR,
  charged: CHARGED_COLOR,
  super: "#c6f135",
  resisted: "#bdb2da",
};

const TAG_TEXT: Record<HitTag, string> = {
  critical: "Critical!",
  charged: "Carregado!",
  super: "Super effective!",
  resisted: "Resisted",
};

function popIn(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Text,
  duration: number,
  delay = 0,
) {
  target.setScale(0.4);
  scene.tweens.add({
    targets: target,
    scale: 1,
    delay,
    duration,
    ease: "Back.easeOut",
    easeParams: [3],
  });
}

function spawnDamageNumber(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.Container[],
  x: number,
  y: number,
  dealt: number,
  tags: HitTag[] = [],
) {
  const critical = tags.includes("critical");
  const charged = tags.includes("charged");
  const size = (critical ? 26 : 20) + (charged ? 6 : 0);
  const jitter = (Math.random() * 2 - 1) * NUMBER_JITTER_X;
  const container = scene.add.container(x + jitter, y).setDepth(NUMBER_DEPTH);
  const number = scene.add
    .text(0, 0, String(dealt), {
      fontFamily: pixelFont(),
      fontSize: `${size}px`,
      color: critical ? CRIT_COLOR : charged ? CHARGED_COLOR : NUMBER_COLOR,
    })
    .setOrigin(0.5)
    .setStroke(OUTLINE_COLOR, 6)
    .setShadow(2, 3, OUTLINE_COLOR, 0, true, true);
  const labels = tags.map((tag, index) =>
    scene.add
      .text(0, -LABEL_GAP_Y - index * LABEL_LINE_Y - (size - 20) / 2, TAG_TEXT[tag].toUpperCase(), {
        fontFamily: titleFont(),
        fontStyle: "italic 900",
        fontSize: "11px",
        color: TAG_COLOR[tag],
        backgroundColor: LABEL_PANEL,
        padding: { left: 5, right: 5, top: 1, bottom: 1 },
      })
      .setOrigin(0.5, 1),
  );
  container.add([...labels, number]);
  popIn(scene, number, NUMBER_POP_MS);
  labels.forEach((label, index) =>
    popIn(scene, label, LABEL_POP_MS, LABEL_DELAY_MS * (index + 1)),
  );
  bucket.push(container);
  const drift = (Math.random() * 2 - 1) * 8;
  scene.tweens.add({
    targets: container,
    y: y - NUMBER_RISE,
    x: container.x + drift,
    duration: NUMBER_POP_MS + NUMBER_HOLD_MS,
    ease: "Quad.easeOut",
  });
  scene.tweens.add({
    targets: container,
    alpha: 0,
    delay: NUMBER_POP_MS + NUMBER_HOLD_MS,
    duration: NUMBER_FADE_MS,
    onComplete: () => {
      const index = bucket.indexOf(container);
      if (index >= 0) bucket.splice(index, 1);
      if (container.scene) container.destroy();
    },
  });
}

const PICKUP_RISE = 44;
const PICKUP_HOLD_MS = 700;

// Texto de consumível pego: mesmo estilo dos números de dano, mais lento.
function spawnPickupLabel(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.Container[],
  x: number,
  y: number,
  text: string,
  color: number,
  caption?: string,
) {
  const tone = `#${color.toString(16).padStart(6, "0")}`;
  const container = scene.add.container(x, y).setDepth(NUMBER_DEPTH);
  const title = scene.add
    .text(0, 0, text, {
      fontFamily: pixelFont(),
      fontSize: "18px",
      color: tone,
    })
    .setOrigin(0.5)
    .setStroke(OUTLINE_COLOR, 6)
    .setShadow(2, 3, OUTLINE_COLOR, 0, true, true);
  container.add(title);
  popIn(scene, title, NUMBER_POP_MS);
  if (caption) {
    const label = scene.add
      .text(0, -LABEL_GAP_Y, caption, {
        fontFamily: pixelFont(),
        fontSize: "10px",
        color: NUMBER_COLOR,
      })
      .setOrigin(0.5, 1)
      .setStroke(OUTLINE_COLOR, 4);
    container.add(label);
    popIn(scene, label, LABEL_POP_MS, LABEL_DELAY_MS);
  }
  bucket.push(container);
  scene.tweens.add({
    targets: container,
    y: y - PICKUP_RISE,
    duration: NUMBER_POP_MS + PICKUP_HOLD_MS,
    ease: "Quad.easeOut",
  });
  scene.tweens.add({
    targets: container,
    alpha: 0,
    delay: NUMBER_POP_MS + PICKUP_HOLD_MS,
    duration: NUMBER_FADE_MS,
    onComplete: () => {
      const index = bucket.indexOf(container);
      if (index >= 0) bucket.splice(index, 1);
      if (container.scene) container.destroy();
    },
  });
}

function clearDamageNumbers(
  scene: Phaser.Scene,
  bucket: Phaser.GameObjects.Container[],
) {
  for (const container of bucket) {
    scene.tweens.killTweensOf(container);
    for (const child of container.list) scene.tweens.killTweensOf(child);
    container.destroy();
  }
  bucket.length = 0;
}

export { clearDamageNumbers, spawnDamageNumber, spawnPickupLabel };
