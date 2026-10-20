type ArenaOutcome = "ongoing" | "victory" | "defeat";

function resolveOutcome(playerHp: number, opponentHp: number): ArenaOutcome {
  if (playerHp <= 0) return "defeat";
  if (opponentHp <= 0) return "victory";
  return "ongoing";
}

export { resolveOutcome };
export type { ArenaOutcome };
