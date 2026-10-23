// Enfeites interativos do mapa em pixel art. Estrela-do-mar cintila parada e,
// quando um lutador chega perto, foge em pulinhos; volta depois de um tempo.
import { FX_TEXTURES } from "@/game/arena/entities/fx-textures";
import { pixelBurst } from "@/game/arena/entities/pixel-fx";
import type { Player } from "@/game/arena/entities/player";
import { waterSplash } from "@/game/arena/entities/water-fx";
import type { Point } from "@/lib/arena/combat";
import type { MapProp } from "@/lib/arena/map";
import type { WorldSize } from "@/lib/arena/terrain";
import Phaser from "phaser";

const PROP_DEPTH = 0.6;
const ART_SCALE = 3;
const SCARE_RADIUS = 90;
const HOP_STEPS = 4;
const HOP_STEP_MS = 90;
const HOP_DISTANCE = 30;
const HOP_LIFT = 10;
const RETURN_MS = 12000;
const TWINKLE_MIN_MS = 500;
const TWINKLE_MAX_MS = 1600;
const SAND_TINTS = [0xd9b27a, 0xb08850, 0xf0d8a8];

type PropState = "idle" | "fleeing" | "gone";

type LiveProp = {
  spec: MapProp;
  image: Phaser.GameObjects.Image;
  home: Point;
  state: PropState;
  twinkleAt: number;
};

type MapProps = {
  props: LiveProp[];
  isWater: (at: Point) => boolean;
};

function createMapProps(
  scene: Phaser.Scene,
  specs: readonly MapProp[],
  isWater: (at: Point) => boolean,
): MapProps {
  const props = specs.map((spec) => ({
    spec,
    image: scene.add.image(0, 0, FX_TEXTURES.starfish).setScale(ART_SCALE).setDepth(PROP_DEPTH),
    home: { x: 0, y: 0 },
    state: "idle" as PropState,
    twinkleAt: 0,
  }));
  return { props, isWater };
}

function layoutMapProps(props: MapProps, size: WorldSize) {
  for (const prop of props.props) {
    prop.home = { x: Math.round(prop.spec.at.x * size.width), y: Math.round(prop.spec.at.y * size.height) };
    if (prop.state === "idle") prop.image.setPosition(prop.home.x, prop.home.y);
  }
}

function flee(scene: Phaser.Scene, props: MapProps, prop: LiveProp, from: Point) {
  prop.state = "fleeing";
  const start = { x: prop.image.x, y: prop.image.y };
  const distance = Math.hypot(start.x - from.x, start.y - from.y) || 1;
  const dir = { x: (start.x - from.x) / distance, y: (start.y - from.y) / distance };
  let landed = start;
  for (let step = 1; step <= HOP_STEPS; step += 1) {
    scene.time.delayedCall(step * HOP_STEP_MS, () => {
      if (!prop.image.scene || prop.state !== "fleeing") return;
      landed = { x: start.x + dir.x * HOP_DISTANCE * step, y: start.y + dir.y * HOP_DISTANCE * step };
      // Pulo em degraus: sobe nos passos ímpares, pousa nos pares.
      const lift = step % 2 === 1 ? HOP_LIFT : 0;
      prop.image
        .setPosition(Math.round(landed.x), Math.round(landed.y - lift))
        .setTexture(step % 2 === 1 ? FX_TEXTURES.starfishAlt : FX_TEXTURES.starfish);
      if (props.isWater(landed) || step === HOP_STEPS) hide(scene, props, prop, landed);
    });
  }
}

// Mergulha (na água) ou se enterra (na areia) e volta para casa depois.
function hide(scene: Phaser.Scene, props: MapProps, prop: LiveProp, at: Point) {
  prop.state = "gone";
  prop.image.setVisible(false);
  if (props.isWater(at)) waterSplash(scene, at, 1);
  else pixelBurst(scene, at, SAND_TINTS, 8, 2, 300, PROP_DEPTH + 0.1);
  scene.time.delayedCall(RETURN_MS, () => {
    if (!prop.image.scene) return;
    prop.state = "idle";
    prop.image.setPosition(prop.home.x, prop.home.y).setTexture(FX_TEXTURES.starfish).setVisible(true);
    pixelBurst(scene, prop.home, SAND_TINTS, 6, 2, 300, PROP_DEPTH + 0.1);
  });
}

function stepMapProps(scene: Phaser.Scene, props: MapProps, fighters: readonly Player[]) {
  const now = scene.time.now;
  for (const prop of props.props) {
    if (prop.state !== "idle") continue;
    const near = fighters.find((fighter) => {
      const feetY = fighter.sprite.y + fighter.fighter.tuning.feetOffsetY;
      return Math.hypot(fighter.sprite.x - prop.image.x, feetY - prop.image.y) < SCARE_RADIUS;
    });
    if (near) {
      flee(scene, props, prop, { x: near.sprite.x, y: near.sprite.y + near.fighter.tuning.feetOffsetY });
      continue;
    }
    if (now < prop.twinkleAt) continue;
    prop.twinkleAt = now + TWINKLE_MIN_MS + Math.random() * (TWINKLE_MAX_MS - TWINKLE_MIN_MS);
    const lit = prop.image.texture.key === FX_TEXTURES.starfishAlt;
    prop.image.setTexture(lit ? FX_TEXTURES.starfish : FX_TEXTURES.starfishAlt);
  }
}

function destroyMapProps(props: MapProps) {
  props.props.forEach((prop) => prop.image.destroy());
}

export { createMapProps, destroyMapProps, layoutMapProps, stepMapProps };
export type { MapProps };
