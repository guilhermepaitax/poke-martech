type ChargeLevel = 0 | 1 | 2;

const CHARGE_LEVEL_MS = [1000, 2000] as const;
const CHARGE_DAMAGE: Record<ChargeLevel, number> = { 0: 1, 1: 1.5, 2: 2.2 };
const CHARGE_MAX_MS = CHARGE_LEVEL_MS[1];

function chargeLevel(heldMs: number): ChargeLevel {
  if (heldMs >= CHARGE_LEVEL_MS[1]) return 2;
  if (heldMs >= CHARGE_LEVEL_MS[0]) return 1;
  return 0;
}

function chargeProgress(heldMs: number) {
  if (!(heldMs > 0)) return 0;
  return Math.min(heldMs / CHARGE_MAX_MS, 1);
}

function chargedDamage(base: number, level: ChargeLevel) {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * CHARGE_DAMAGE[level]));
}

function cooldownRatio(now: number, readyAt: number, cooldownMs: number) {
  if (cooldownMs <= 0 || now >= readyAt) return 0;
  return Math.min((readyAt - now) / cooldownMs, 1);
}

export {
  CHARGE_DAMAGE,
  CHARGE_LEVEL_MS,
  CHARGE_MAX_MS,
  chargedDamage,
  chargeLevel,
  chargeProgress,
  cooldownRatio,
};
export type { ChargeLevel };
