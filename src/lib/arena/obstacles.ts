type ObstacleSpec = {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
};

type ObstacleDamage = {
  hp: number;
  broken: boolean;
};

type CrackStage = 0 | 1 | 2 | 3;

const CRACK_STAGES = 3;

const OBSTACLE_LAYOUT: readonly ObstacleSpec[] = [
  { x: 0.3, y: 0.27, width: 220, height: 110, hp: 90 },
  { x: 0.68, y: 0.7, width: 110, height: 220, hp: 90 },
  { x: 0.5, y: 0.22, width: 140, height: 90, hp: 55 },
  { x: 0.2, y: 0.68, width: 90, height: 140, hp: 55 },
  { x: 0.55, y: 0.74, width: 140, height: 90, hp: 55 },
  { x: 0.42, y: 0.5, width: 72, height: 72, hp: 30 },
  { x: 0.8, y: 0.3, width: 72, height: 72, hp: 30 },
  { x: 0.62, y: 0.42, width: 64, height: 64, hp: 30 },
];

function damageObstacle(hp: number, damage: number): ObstacleDamage {
  if (hp <= 0) return { hp: 0, broken: true };
  const next = Math.max(0, hp - Math.max(0, damage));
  return { hp: next, broken: next === 0 };
}

function crackStage(hp: number, maxHp: number): CrackStage {
  if (maxHp <= 0 || hp >= maxHp) return 0;
  const lost = 1 - Math.max(0, hp) / maxHp;
  const stage = Math.min(CRACK_STAGES, Math.ceil(lost * (CRACK_STAGES + 1) - 1e-9));
  return Math.max(0, stage) as CrackStage;
}

export { CRACK_STAGES, crackStage, damageObstacle, OBSTACLE_LAYOUT };
export type { CrackStage, ObstacleDamage, ObstacleSpec };
