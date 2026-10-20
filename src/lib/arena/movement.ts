type MoveVector = {
  x: number;
  y: number;
};

type CardinalFacing = "south" | "east" | "north" | "west";

type Facing =
  | "east"
  | "south-east"
  | "south"
  | "south-west"
  | "west"
  | "north-west"
  | "north"
  | "north-east";

const DASH_COOLDOWN_MS = 650;

const FACING_ORDER: readonly Facing[] = [
  "east",
  "south-east",
  "south",
  "south-west",
  "west",
  "north-west",
  "north",
  "north-east",
];

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

function facingFromAim(x: number, y: number, previous: Facing): Facing {
  if (x === 0 && y === 0) return previous;
  const sector = Math.floor((Math.atan2(y, x) + Math.PI / 8) / (Math.PI / 4));
  const index = ((sector % 8) + 8) % 8;
  return FACING_ORDER[index] ?? previous;
}

function cardinalFacing(facing: Facing): CardinalFacing {
  if (facing === "south-east" || facing === "north-east") return "east";
  if (facing === "south-west" || facing === "north-west") return "west";
  return facing;
}

function facingVector(facing: Facing): MoveVector {
  const angle = FACING_ORDER.indexOf(facing) * (Math.PI / 4);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function dashHeading(move: MoveVector, facing: Facing): MoveVector {
  const heading = normalizeMove(move.x, move.y);
  if (heading.x !== 0 || heading.y !== 0) return heading;
  return facingVector(facing);
}

export {
  cardinalFacing,
  DASH_COOLDOWN_MS,
  dashHeading,
  facingFromAim,
  facingFromMove,
  facingVector,
  normalizeMove,
};
export type { CardinalFacing, Facing, MoveVector };
