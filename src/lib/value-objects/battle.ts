const BATTLE_DIFFICULTIES = ["easy", "normal"] as const;
const BATTLE_STATUSES = ["active", "won", "lost", "forfeited"] as const;

type BattleDifficulty = (typeof BATTLE_DIFFICULTIES)[number];
type BattleStatus = (typeof BATTLE_STATUSES)[number];

function isBattleDifficulty(value: string): value is BattleDifficulty {
  return BATTLE_DIFFICULTIES.some((item) => item === value);
}

function isBattleStatus(value: string): value is BattleStatus {
  return BATTLE_STATUSES.some((item) => item === value);
}

const DIFFICULTY_LABELS: Record<BattleDifficulty, string> = {
  easy: "Fácil",
  normal: "Normal",
};

export {
  BATTLE_DIFFICULTIES,
  BATTLE_STATUSES,
  DIFFICULTY_LABELS,
  isBattleDifficulty,
  isBattleStatus,
};
export type { BattleDifficulty, BattleStatus };
