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

export { CRACK_STAGES, crackStage, damageObstacle };
export type { CrackStage, ObstacleDamage, ObstacleSpec };
