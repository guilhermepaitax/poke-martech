import Phaser from "phaser";

const GROUND_DEPTH = 1;
const PLATE_DEPTH = 3;
const RING_WIDTH = 70;
const RING_HEIGHT = 18;
const SHADOW_WIDTH = 70;
const SHADOW_HEIGHT = 22;
const BAR_WIDTH = 70;
const BAR_HEIGHT = 8;
const BAR_INSET = 2;
const BAR_OFFSET_Y = 20;
const NAME_OFFSET_Y = 25;

let cachedFont: string | null = null;

type PlayerMarker = {
  ground: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Container;
  hpFill: Phaser.GameObjects.Rectangle;
};

function arenaFont() {
  if (cachedFont) return cachedFont;
  if (typeof document === "undefined") {
    cachedFont = "sans-serif";
    return cachedFont;
  }
  const font = getComputedStyle(document.body).fontFamily.trim();
  cachedFont = font || "sans-serif";
  return cachedFont;
}

function hpFillWidth(hp: number, maxHp: number) {
  const span = BAR_WIDTH - BAR_INSET * 2;
  if (maxHp <= 0) return 0;
  const ratio = Math.min(Math.max(hp / maxHp, 0), 1);
  return span * ratio;
}

function createMarker(
  scene: Phaser.Scene,
  x: number,
  feetY: number,
  name: string,
  hp: number,
  maxHp: number,
): PlayerMarker {
  const shadow = scene.add.ellipse(0, 3, SHADOW_WIDTH, SHADOW_HEIGHT, 0x120c08, 0.4);
  const ringShade = scene.add.ellipse(0, 1, RING_WIDTH + 6, RING_HEIGHT + 4, 0x2a1a0c, 0);
  ringShade.setStrokeStyle(4, 0x2a1a0c, 0.4);
  const ring = scene.add.ellipse(0, 0, RING_WIDTH, RING_HEIGHT, 0xffe08a, 0);
  ring.setStrokeStyle(2, 0xffe08a, 1);
  ring.setSmoothness(32);
  ringShade.setSmoothness(32);
  const ground = scene.add.container(x, feetY, [shadow, ringShade, ring]);
  ground.setDepth(GROUND_DEPTH);

  const hpTrack = scene.add.rectangle(0, BAR_OFFSET_Y, BAR_WIDTH, BAR_HEIGHT, 0x111429, 1);
  const fillWidth = hpFillWidth(hp, maxHp);
  const hpFill = scene.add.rectangle(
    -BAR_WIDTH / 2 + BAR_INSET + fillWidth / 2,
    BAR_OFFSET_Y,
    fillWidth,
    BAR_HEIGHT - BAR_INSET * 2,
    0x62d26f,
    1,
  );
  const nameLabel = scene.add
    .text(0, NAME_OFFSET_Y, name, {
      fontFamily: arenaFont(),
      fontSize: "12px",
      color: "#f7f3ea",
    })
    .setOrigin(0.5, 0)
    .setStroke("#2a1c10", 3);
  const plate = scene.add.container(x, feetY, [hpTrack, hpFill, nameLabel]);
  plate.setDepth(PLATE_DEPTH);

  return { ground, plate, hpFill };
}

function setMarkerHp(marker: PlayerMarker, hp: number, maxHp: number) {
  const fillWidth = hpFillWidth(hp, maxHp);
  marker.hpFill.setVisible(fillWidth > 0);
  if (fillWidth <= 0) return;
  marker.hpFill.setSize(fillWidth, BAR_HEIGHT - BAR_INSET * 2);
  marker.hpFill.setPosition(-BAR_WIDTH / 2 + BAR_INSET + fillWidth / 2, BAR_OFFSET_Y);
}

function syncMarker(marker: PlayerMarker, x: number, y: number) {
  marker.ground.setPosition(x, y);
  marker.plate.setPosition(x, y);
}

export { arenaFont, createMarker, setMarkerHp, syncMarker };
export type { PlayerMarker };
