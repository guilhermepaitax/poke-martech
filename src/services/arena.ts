import type { ArenaDifficulty } from "@/lib/arena/cpu";
import { api } from "@/services/http";
import type { ArenaMatchStart, ArenaWinReward } from "@/types/catalog";

function startArenaMatch(difficulty: ArenaDifficulty) {
  return api<ArenaMatchStart>("/api/arena/matches", {
    method: "POST",
    body: JSON.stringify({ difficulty }),
  });
}

function claimArenaWin(matchId: string) {
  return api<ArenaWinReward>(`/api/arena/matches/${matchId}/win`, { method: "POST" });
}

function recordArenaDefeat(matchId: string) {
  return api<{ success: true }>(`/api/arena/matches/${matchId}/defeat`, { method: "POST" });
}

export { claimArenaWin, recordArenaDefeat, startArenaMatch };
