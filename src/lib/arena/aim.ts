import type { Point } from "./combat";

// Formatos de mira reutilizáveis. Hoje só o cone (Névoa de Veneno); outro
// formato (círculo no chão, linha larga...) entra como novo `kind` aqui e no
// desenho em `src/game/arena/entities/aim.ts`.
//
// Cone com força: segurar o clique enche a força de 0 a 1 em `powerMs`; o
// alcance vai de `minRange` (força 0) a `range` (força 1). Soltar dispara.
type ConeAim = {
  kind: "cone";
  range: number;
  minRange: number;
  // Largura do cone na boca e no alcance máximo.
  nearWidth: number;
  farWidth: number;
  powerMs: number;
};

type AimSpec = ConeAim;

function aimPower(heldMs: number, powerMs: number) {
  if (!(heldMs > 0) || powerMs <= 0) return powerMs <= 0 ? 1 : 0;
  return Math.min(1, heldMs / powerMs);
}

function aimReach(spec: AimSpec, power: number) {
  const clamped = Math.min(1, Math.max(0, power));
  return spec.minRange + (spec.range - spec.minRange) * clamped;
}

// Força que faz o alcance cair em `distance` (a CPU mira direto no alvo).
function powerForDistance(spec: AimSpec, distance: number) {
  if (spec.range <= spec.minRange) return 1;
  return Math.min(1, Math.max(0, (distance - spec.minRange) / (spec.range - spec.minRange)));
}

// Largura do cone a `distance` da boca.
function coneWidth(spec: ConeAim, distance: number) {
  const t = spec.range > 0 ? Math.min(1, Math.max(0, distance / spec.range)) : 1;
  return spec.nearWidth + (spec.farWidth - spec.nearWidth) * t;
}

// Quadrilátero do cone de `from` até `length` px na direção `direction`:
// boca esquerda, ponta esquerda, ponta direita, boca direita.
function conePolygon(from: Point, direction: Point, spec: ConeAim, length = spec.range): Point[] {
  const size = Math.hypot(direction.x, direction.y);
  if (size === 0) return [];
  const ux = direction.x / size;
  const uy = direction.y / size;
  const nx = -uy;
  const ny = ux;
  const near = spec.nearWidth / 2;
  const far = coneWidth(spec, length) / 2;
  const tip = { x: from.x + ux * length, y: from.y + uy * length };
  return [
    { x: from.x + nx * near, y: from.y + ny * near },
    { x: tip.x + nx * far, y: tip.y + ny * far },
    { x: tip.x - nx * far, y: tip.y - ny * far },
    { x: from.x - nx * near, y: from.y - ny * near },
  ];
}

export { aimPower, aimReach, conePolygon, coneWidth, powerForDistance };
export type { AimSpec, ConeAim };
