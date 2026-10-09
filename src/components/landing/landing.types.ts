type LandingPieceId = "art" | "evolution" | "attack" | "stats" | "flavor";

const LANDING_PIECE_IDS = [
  "art",
  "evolution",
  "attack",
  "stats",
  "flavor",
] as const satisfies readonly LandingPieceId[];

export { LANDING_PIECE_IDS };
export type { LandingPieceId };
