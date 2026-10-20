import { arenaFont } from "@/game/arena/entities/marker";
import type { HitTag } from "@/lib/arena/combat";
import Phaser from "phaser";

const NUMBER_RISE = 30;
const NUMBER_POP_MS = 140;
const NUMBER_HOLD_MS = 350;
const NUMBER_FADE_MS = 300;
const NUMBER_DEPTH = 9;
const NUMBER_JITTER_X = 10;
const LABEL_GAP_Y = 20;
const LABEL_LINE_Y = 16;
const LABEL_DELAY_MS = 60;
const LABEL_POP_MS = 120;

const NUMBER_COLOR = "#ffffff";
const CRIT_COLOR = "#ffd23a";
const LABEL_COLOR = "#ff9a3a";
const OUTLINE_COLOR = "#1a120c";

const TAG_TEXT: Record<HitTag, string> = {
  critical: "Critical!",
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
  const jitter = (Math.random() * 2 - 1) * NUMBER_JITTER_X;
  const container = scene.add.container(x + jitter, y).setDepth(NUMBER_DEPTH);
  const number = scene.add
    .text(0, 0, String(dealt), {
      fontFamily: arenaFont(),
      fontSize: critical ? "36px" : "28px",
      fontStyle: "bold",
      color: critical ? CRIT_COLOR : NUMBER_COLOR,
    })
    .setOrigin(0.5)
    .setStroke(OUTLINE_COLOR, 5);
  const labels = tags.map((tag, index) =>
    scene.add
      .text(0, -LABEL_GAP_Y - index * LABEL_LINE_Y - (critical ? 4 : 0), TAG_TEXT[tag], {
        fontFamily: arenaFont(),
        fontSize: "14px",
        fontStyle: "bold",
        color: LABEL_COLOR,
      })
      .setOrigin(0.5, 1)
      .setStroke(OUTLINE_COLOR, 4),
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

export { clearDamageNumbers, spawnDamageNumber };
