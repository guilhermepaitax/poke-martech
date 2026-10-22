import { playArenaAudio } from "@/game/arena/entities/audio";
import {
  buildBranch,
  createRng,
  spawnDust,
  strokePartial,
  track,
  type Polyline,
} from "@/game/arena/entities/cracks";
import type { Point } from "@/lib/arena/combat";
import {
  crackStage,
  damageObstacle,
  type CrackStage,
  type ObstacleSpec,
} from "@/lib/arena/obstacles";
import Phaser from "phaser";

const ART_DEPTH = 1.5;
const CRACK_DEPTH = 1.6;
const CHIP_DEPTH = 2.5;
const RUBBLE_DEPTH = 0.45;
const CORNER = 6;
const FRAME_INSET = 10;
const STUD_SIZE = 6;
const SHADOW_OFFSET = { x: 6, y: 10 };
const CRACK_DRAW_MS = 140;
const JOLT_PX = 3;
const JOLT_MS = 40;
const CHIP_MS = 360;
const SHARD_MIN_MS = 620;
const SHARD_SPREAD_MS = 320;
const BREAK_SHAKE_MS = 160;
const BREAK_SHAKE = 0.006;
const BRANCHES_BY_STAGE: Record<Exclude<CrackStage, 0>, number> = { 1: 3, 2: 4, 3: 5 };
const STONE = {
  shadow: 0x000000,
  side: 0x7a5530,
  face: 0xc99d64,
  light: 0xe9c995,
  edge: 0x4a2f18,
  frame: 0x8a6236,
  trim: 0xf0cf7a,
  inlay: 0x9c6f3c,
  speck: 0x9f7748,
} as const;
const SHARD_COLORS = [STONE.face, STONE.side, STONE.light, STONE.frame, STONE.trim] as const;
const CRACK_COLOR = 0x2a1a10;
const CRACK_HIGHLIGHT = 0xf3dcb0;

type CrackSet = { trunk: Polyline; forks: Polyline[] }[];

type Obstacle = {
  spec: ObstacleSpec;
  body: Phaser.GameObjects.Rectangle;
  art: Phaser.GameObjects.Graphics;
  cracks: Phaser.GameObjects.Graphics;
  hp: number;
  maxHp: number;
  stage: CrackStage;
  broken: boolean;
  lines: CrackSet;
  seed: number;
  fx: Phaser.GameObjects.GameObject[];
};

function thickness(height: number) {
  return Math.round(Math.min(16, Math.max(8, height * 0.12)));
}

function faceBounds(spec: ObstacleSpec) {
  const thick = thickness(spec.height);
  return {
    left: -spec.width / 2,
    top: -spec.height / 2,
    width: spec.width,
    height: spec.height - thick,
    thick,
  };
}

function diamond(cx: number, cy: number, radius: number) {
  return [
    new Phaser.Math.Vector2(cx, cy - radius),
    new Phaser.Math.Vector2(cx + radius, cy),
    new Phaser.Math.Vector2(cx, cy + radius),
    new Phaser.Math.Vector2(cx - radius, cy),
  ];
}

function paintObstacle(graphics: Phaser.GameObjects.Graphics, spec: ObstacleSpec, seed: number) {
  const face = faceBounds(spec);
  const rng = createRng(seed);
  graphics.clear();
  graphics.fillStyle(STONE.shadow, 0.3);
  graphics.fillRoundedRect(
    face.left + SHADOW_OFFSET.x,
    face.top + SHADOW_OFFSET.y,
    spec.width,
    spec.height,
    CORNER,
  );
  graphics.fillStyle(STONE.side, 1);
  graphics.fillRoundedRect(face.left, face.top, spec.width, spec.height, CORNER);
  graphics.fillStyle(STONE.face, 1);
  graphics.fillRoundedRect(face.left, face.top, face.width, face.height, CORNER);
  graphics.fillStyle(STONE.light, 0.7);
  graphics.fillRect(face.left + CORNER, face.top + 1, face.width - CORNER * 2, 2);
  const specks = Math.round((face.width * face.height) / 260);
  for (let index = 0; index < specks; index += 1) {
    graphics.fillStyle(rng() < 0.5 ? STONE.speck : STONE.light, 0.45);
    graphics.fillRect(
      face.left + 4 + rng() * (face.width - 8),
      face.top + 4 + rng() * (face.height - 8),
      1 + Math.round(rng() * 2),
      1 + Math.round(rng() * 2),
    );
  }
  const inset = Math.min(FRAME_INSET, face.width / 5, face.height / 5);
  const frame = {
    x: face.left + inset,
    y: face.top + inset,
    width: face.width - inset * 2,
    height: face.height - inset * 2,
  };
  graphics.lineStyle(2, STONE.frame, 0.9);
  graphics.strokeRect(frame.x, frame.y, frame.width, frame.height);
  graphics.lineStyle(1, STONE.light, 0.55);
  graphics.strokeRect(frame.x + 2, frame.y + 2, frame.width - 4, frame.height - 4);
  const stud = Math.min(STUD_SIZE, inset);
  [
    [frame.x, frame.y],
    [frame.x + frame.width, frame.y],
    [frame.x, frame.y + frame.height],
    [frame.x + frame.width, frame.y + frame.height],
  ].forEach(([x = 0, y = 0]) => {
    graphics.fillStyle(STONE.edge, 1);
    graphics.fillRect(x - stud / 2 - 1, y - stud / 2 - 1, stud + 2, stud + 2);
    graphics.fillStyle(STONE.trim, 1);
    graphics.fillRect(x - stud / 2, y - stud / 2, stud, stud);
  });
  const cx = face.left + face.width / 2;
  const cy = face.top + face.height / 2;
  const radius = Math.min(face.width, face.height) * 0.2;
  graphics.fillStyle(STONE.inlay, 1);
  graphics.fillPoints(diamond(cx, cy, radius), true);
  graphics.lineStyle(2, STONE.trim, 1);
  graphics.strokePoints(diamond(cx, cy, radius * 0.55), true);
  graphics.lineStyle(2, STONE.edge, 1);
  graphics.strokeRoundedRect(face.left, face.top, spec.width, spec.height, CORNER);
  graphics.lineStyle(1, STONE.edge, 0.8);
  graphics.lineBetween(
    face.left + 1,
    face.top + face.height,
    face.left + spec.width - 1,
    face.top + face.height,
  );
}

function clipToFace(points: Polyline, spec: ObstacleSpec) {
  const face = faceBounds(spec);
  const inside = (point: Point) =>
    point.x > face.left + 2 &&
    point.x < face.left + face.width - 2 &&
    point.y > face.top + 2 &&
    point.y < face.top + face.height - 2;
  const kept: Polyline = [];
  for (const point of points) {
    if (!inside(point)) break;
    kept.push(point);
  }
  return kept;
}

function growCracks(obstacle: Obstacle, origin: Point, stage: Exclude<CrackStage, 0>): CrackSet {
  const rng = createRng(obstacle.seed + stage * 7919 + Math.floor(Math.random() * 1000));
  const face = faceBounds(obstacle.spec);
  const local = {
    x: Phaser.Math.Clamp(origin.x, face.left + 4, face.left + face.width - 4),
    y: Phaser.Math.Clamp(origin.y, face.top + 4, face.top + face.height - 4),
  };
  const length = Math.min(face.width, face.height) * (0.45 + stage * 0.2);
  const count = BRANCHES_BY_STAGE[stage];
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count + (rng() - 0.5) * 0.9;
    const branch = buildBranch(angle, length * (0.6 + rng() * 0.5), rng);
    const shift = (points: Polyline) =>
      clipToFace(
        points.map((point) => ({ x: point.x + local.x, y: point.y + local.y })),
        obstacle.spec,
      );
    return {
      trunk: shift(branch.trunk),
      forks: branch.forks.map(shift).filter((fork) => fork.length >= 2),
    };
  }).filter((branch) => branch.trunk.length >= 2);
}

function paintLines(
  graphics: Phaser.GameObjects.Graphics,
  lines: CrackSet,
  width: number,
  progress: number,
) {
  const forkProgress = Math.max(0, progress * 2 - 1);
  graphics.lineStyle(width, CRACK_HIGHLIGHT, 0.4);
  for (const branch of lines) {
    strokePartial(graphics, branch.trunk, progress, 1.5);
    branch.forks.forEach((fork) => strokePartial(graphics, fork, forkProgress, 1.5));
  }
  graphics.lineStyle(width, CRACK_COLOR, 0.95);
  for (const branch of lines) {
    strokePartial(graphics, branch.trunk, progress, 0);
    branch.forks.forEach((fork) => strokePartial(graphics, fork, forkProgress, 0));
  }
}

function paintCracks(obstacle: Obstacle, fresh: CrackSet = [], progress = 1) {
  const graphics = obstacle.cracks;
  const width = obstacle.stage >= 3 ? 3 : 2;
  graphics.clear();
  paintLines(graphics, obstacle.lines.filter((branch) => !fresh.includes(branch)), width, 1);
  if (fresh.length > 0) paintLines(graphics, fresh, width, progress);
}

function createObstacle(scene: Phaser.Scene, spec: ObstacleSpec, seed: number): Obstacle {
  const body = scene.add.rectangle(0, 0, spec.width, spec.height).setVisible(false);
  scene.physics.add.existing(body, true);
  const art = scene.add.graphics().setDepth(ART_DEPTH);
  const cracks = scene.add.graphics().setDepth(CRACK_DEPTH);
  paintObstacle(art, spec, seed);
  return {
    spec,
    body,
    art,
    cracks,
    hp: spec.hp,
    maxHp: spec.hp,
    stage: 0,
    broken: false,
    lines: [],
    seed,
    fx: [],
  };
}

function placeObstacle(scene: Phaser.Scene, obstacle: Obstacle, x: number, y: number) {
  scene.tweens.killTweensOf([obstacle.art, obstacle.cracks]);
  obstacle.body.setPosition(x, y).setSize(obstacle.spec.width, obstacle.spec.height);
  obstacle.art.setPosition(x, y);
  obstacle.cracks.setPosition(x, y);
  if (obstacle.body.body instanceof Phaser.Physics.Arcade.StaticBody) {
    obstacle.body.body.updateFromGameObject();
  }
}

function obstacleRect(obstacle: Obstacle) {
  return {
    x: obstacle.body.x,
    y: obstacle.body.y,
    width: obstacle.spec.width,
    height: obstacle.spec.height,
  };
}

function flingPiece(
  scene: Phaser.Scene,
  obstacle: Obstacle,
  piece: Phaser.GameObjects.Rectangle,
  to: Point,
  lift: number,
  durationMs: number,
) {
  const release = track(obstacle.fx, piece);
  const from = { x: piece.x, y: piece.y };
  const spin = (Math.random() - 0.5) * Math.PI * 4;
  const hop = { t: 0 };
  scene.tweens.add({
    targets: hop,
    t: 1,
    duration: durationMs,
    ease: "Quad.easeOut",
    onUpdate: () => {
      if (!piece.scene) return;
      piece.setPosition(
        from.x + (to.x - from.x) * hop.t,
        from.y + (to.y - from.y) * hop.t - Math.sin(hop.t * Math.PI) * lift,
      );
      piece.setRotation(spin * hop.t);
      piece.setAlpha(1 - hop.t * hop.t);
    },
    onComplete: release,
  });
}

function spawnChips(scene: Phaser.Scene, obstacle: Obstacle, at: Point, count: number) {
  for (let index = 0; index < count; index += 1) {
    const size = 3 + Math.random() * 4;
    const color = SHARD_COLORS[Math.floor(Math.random() * SHARD_COLORS.length)] ?? STONE.face;
    const chip = scene.add.rectangle(at.x, at.y, size, size, color).setDepth(CHIP_DEPTH);
    const angle = Math.random() * Math.PI * 2;
    const reach = 16 + Math.random() * 22;
    flingPiece(
      scene,
      obstacle,
      chip,
      { x: at.x + Math.cos(angle) * reach, y: at.y + Math.sin(angle) * reach * 0.7 },
      8 + Math.random() * 12,
      CHIP_MS,
    );
  }
}

function jolt(scene: Phaser.Scene, obstacle: Obstacle) {
  const targets = [obstacle.art, obstacle.cracks];
  scene.tweens.killTweensOf(targets);
  targets.forEach((target) => target.setPosition(obstacle.body.x, obstacle.body.y));
  scene.tweens.add({
    targets,
    x: obstacle.body.x + (Math.random() < 0.5 ? -JOLT_PX : JOLT_PX),
    duration: JOLT_MS,
    yoyo: true,
    repeat: 1,
  });
}

function leaveRubble(scene: Phaser.Scene, obstacle: Obstacle) {
  const { x, y } = obstacle.body;
  const spread = { x: obstacle.spec.width / 2, y: obstacle.spec.height / 2 };
  const pieces = 6 + Math.floor(Math.random() * 4);
  for (let index = 0; index < pieces; index += 1) {
    const size = 4 + Math.random() * 8;
    const color = SHARD_COLORS[Math.floor(Math.random() * 3)] ?? STONE.side;
    const rubble = scene.add
      .rectangle(
        x + (Math.random() - 0.5) * spread.x * 1.6,
        y + (Math.random() - 0.5) * spread.y * 1.6,
        size,
        size * (0.6 + Math.random() * 0.4),
        color,
      )
      .setRotation(Math.random() * Math.PI)
      .setDepth(RUBBLE_DEPTH)
      .setAlpha(0.85);
    obstacle.fx.push(rubble);
  }
}

function breakObstacle(scene: Phaser.Scene, obstacle: Obstacle) {
  obstacle.broken = true;
  if (obstacle.body.body instanceof Phaser.Physics.Arcade.StaticBody) {
    obstacle.body.body.enable = false;
  }
  scene.tweens.killTweensOf([obstacle.art, obstacle.cracks]);
  obstacle.art.setVisible(false);
  obstacle.cracks.setVisible(false);
  const { x, y } = obstacle.body;
  const { width, height } = obstacle.spec;
  const shards = Math.min(22, 10 + Math.round((width * height) / 2400));
  for (let index = 0; index < shards; index += 1) {
    const startX = x + (Math.random() - 0.5) * width;
    const startY = y + (Math.random() - 0.5) * height;
    const size = 6 + Math.random() * Math.min(18, Math.min(width, height) / 4);
    const color = SHARD_COLORS[Math.floor(Math.random() * SHARD_COLORS.length)] ?? STONE.face;
    const shard = scene.add
      .rectangle(startX, startY, size, size * (0.6 + Math.random() * 0.5), color)
      .setStrokeStyle(1, STONE.edge, 0.8)
      .setDepth(CHIP_DEPTH);
    const angle = Math.atan2(startY - y, startX - x) + (Math.random() - 0.5) * 0.8;
    const reach = 40 + Math.random() * 70;
    flingPiece(
      scene,
      obstacle,
      shard,
      { x: startX + Math.cos(angle) * reach, y: startY + Math.sin(angle) * reach * 0.7 },
      20 + Math.random() * 30,
      SHARD_MIN_MS + Math.random() * SHARD_SPREAD_MS,
    );
  }
  spawnDust(scene, obstacle.fx, x, y + height / 2 - 6, 10);
  leaveRubble(scene, obstacle);
  playArenaAudio(scene, "explosion");
  scene.cameras.main.shake(BREAK_SHAKE_MS, BREAK_SHAKE);
}

function hitObstacle(scene: Phaser.Scene, obstacle: Obstacle | undefined, damage: number, at: Point) {
  if (!obstacle || obstacle.broken || damage <= 0) return false;
  const result = damageObstacle(obstacle.hp, damage);
  obstacle.hp = result.hp;
  spawnChips(scene, obstacle, at, 4 + Math.min(6, Math.floor(damage / 4)));
  if (result.broken) {
    breakObstacle(scene, obstacle);
    return true;
  }
  jolt(scene, obstacle);
  const stage = crackStage(obstacle.hp, obstacle.maxHp);
  if (stage === 0 || stage === obstacle.stage) {
    return false;
  }
  const local = { x: at.x - obstacle.body.x, y: at.y - obstacle.body.y };
  const fresh: CrackSet = [];
  for (let next = obstacle.stage + 1; next <= stage; next += 1) {
    fresh.push(...growCracks(obstacle, local, next as Exclude<CrackStage, 0>));
  }
  obstacle.stage = stage;
  obstacle.lines.push(...fresh);
  const draw = { progress: 0 };
  scene.tweens.add({
    targets: draw,
    progress: 1,
    duration: CRACK_DRAW_MS,
    ease: "Quad.easeOut",
    onUpdate: () => {
      if (obstacle.cracks.scene && !obstacle.broken) paintCracks(obstacle, fresh, draw.progress);
    },
    onComplete: () => {
      if (obstacle.cracks.scene && !obstacle.broken) paintCracks(obstacle);
    },
  });
  return false;
}

function destroyObstacles(scene: Phaser.Scene, obstacles: Obstacle[]) {
  for (const obstacle of obstacles) {
    for (const object of obstacle.fx) {
      scene.tweens.killTweensOf(object);
      if (object.scene) object.destroy();
    }
    obstacle.fx.length = 0;
    scene.tweens.killTweensOf([obstacle.art, obstacle.cracks]);
  }
}

export {
  createObstacle,
  destroyObstacles,
  hitObstacle,
  obstacleRect,
  placeObstacle,
};
export type { Obstacle };
