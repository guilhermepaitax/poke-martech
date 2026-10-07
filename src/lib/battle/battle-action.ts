type BattleAction =
  | { type: "setup"; activeUid: string; benchUids: string[] }
  | { type: "attach_energy"; targetUid: string }
  | { type: "play_basic"; handUid: string }
  | { type: "evolve"; handUid: string; targetUid: string }
  | { type: "retreat"; benchUid: string }
  | { type: "attack"; attackIndex: number }
  | { type: "promote"; benchUid: string }
  | { type: "end_turn" };

type BattleActionType = BattleAction["type"];

export type { BattleAction, BattleActionType };
