import { arenaFont } from "@/game/arena/entities/marker";
import type { AttackKind } from "@/lib/arena/combat";
import Phaser from "phaser";

const ACTIVE_COLOR = "#ffe08a";
const INACTIVE_COLOR = "#a89880";
const HUD_DEPTH = 20;

type AttackHud = {
  meleeLabel: Phaser.GameObjects.Text;
  fireLabel: Phaser.GameObjects.Text;
};

function createAttackLabel(scene: Phaser.Scene, text: string) {
  return scene.add
    .text(16, 16, text, {
      fontFamily: arenaFont(),
      fontSize: "14px",
      color: INACTIVE_COLOR,
    })
    .setStroke("#2a1c10", 3)
    .setScrollFactor(0)
    .setDepth(HUD_DEPTH);
}

function createAttackHud(scene: Phaser.Scene): AttackHud {
  return {
    meleeLabel: createAttackLabel(scene, "1  Corpo a corpo"),
    fireLabel: createAttackLabel(scene, "2  Fogo"),
  };
}

function layoutAttackHud(scene: Phaser.Scene, hud: AttackHud) {
  const y = Math.max(scene.scale.height - 36, 8);
  hud.meleeLabel.setPosition(16, y);
  hud.fireLabel.setPosition(16 + hud.meleeLabel.width + 18, y);
}

function paintAttackHud(hud: AttackHud, kind: AttackKind) {
  hud.meleeLabel.setColor(kind === "melee" ? ACTIVE_COLOR : INACTIVE_COLOR);
  hud.fireLabel.setColor(kind === "fire" ? ACTIVE_COLOR : INACTIVE_COLOR);
}

function destroyAttackHud(hud: AttackHud) {
  hud.meleeLabel.destroy();
  hud.fireLabel.destroy();
}

export { createAttackHud, destroyAttackHud, layoutAttackHud, paintAttackHud };
export type { AttackHud };
