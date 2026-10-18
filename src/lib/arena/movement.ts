type MoveVector = {
  x: number;
  y: number;
};

type CardinalFacing = "south" | "east" | "north" | "west";

function normalizeMove(x: number, y: number): MoveVector {
  const length = Math.hypot(x, y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

function facingFromMove(x: number, y: number, previous: CardinalFacing): CardinalFacing {
  if (x === 0 && y === 0) return previous;
  if (Math.abs(x) >= Math.abs(y)) return x > 0 ? "east" : "west";
  return y > 0 ? "south" : "north";
}

export { facingFromMove, normalizeMove };
export type { CardinalFacing, MoveVector };
