import type { MoveVector } from "./movement";

type MenuDirection = "up" | "down" | "left" | "right";

type MenuRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const STEP: Record<MenuDirection, MoveVector> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Peso do desvio lateral: prefere o vizinho alinhado ao mais perto na diagonal.
const SIDE_WEIGHT = 2;

// Direção dominante do direcional/analógico; nula abaixo do limiar.
function menuDirection(move: MoveVector, threshold = 0.5): MenuDirection | null {
  if (Math.max(Math.abs(move.x), Math.abs(move.y)) < threshold) return null;
  if (Math.abs(move.x) >= Math.abs(move.y)) return move.x > 0 ? "right" : "left";
  return move.y > 0 ? "down" : "up";
}

function center(rect: MenuRect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

// Foco espacial: o candidato mais próximo do lado pedido. Nulo se não houver nada lá.
function nextMenuIndex(rects: readonly MenuRect[], current: number, direction: MenuDirection) {
  const from = rects[current];
  if (!from) return null;
  const origin = center(from);
  const step = STEP[direction];
  let best: number | null = null;
  let bestScore = Infinity;
  rects.forEach((rect, index) => {
    if (index === current) return;
    const point = center(rect);
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const along = dx * step.x + dy * step.y;
    if (along <= 1) return;
    const side = Math.abs(dx * step.y - dy * step.x);
    const score = along + side * SIDE_WEIGHT;
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}

export { menuDirection, nextMenuIndex };
export type { MenuDirection, MenuRect };
