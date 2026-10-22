import {
  ARENA_DAILY_REWARDED_WINS,
  ARENA_MIN_MATCH_SECONDS,
  ARENA_WIN_REWARD,
  arenaDayStart,
} from "@/lib/arena/rewards";
import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { ArenaMatchRepository } from "@/server/application/contracts/repositories/arena-match-repository";
import { ConflictError, NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { ArenaWinReward } from "@/types/catalog";

const errors = {
  not_found: () => new NotFoundError("Partida"),
  already_finished: () => new ConflictError("Partida já finalizada."),
  too_fast: () => new ValidationError("Partida curta demais."),
  no_wallet: () => new ValidationError("Carteira não encontrada."),
} as const;

class ClaimArenaWin {
  constructor(
    private readonly matches: ArenaMatchRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: { matchId: string }, actor: Actor | null): Promise<Result<ArenaWinReward>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const now = this.now();
    const result = await this.matches.claimWin({
      matchId: input.matchId,
      userId: auth.value.id,
      startedBefore: new Date(now.getTime() - ARENA_MIN_MATCH_SECONDS * 1000),
      dayStart: arenaDayStart(now),
      rewardFor: (difficulty) => ARENA_WIN_REWARD[difficulty],
      dailyLimit: ARENA_DAILY_REWARDED_WINS,
    });
    if (result.status !== "ok") return err(errors[result.status]());
    return success({
      reward: result.reward,
      coins: result.coins,
      rewardedToday: result.rewardedToday,
      dailyLimit: ARENA_DAILY_REWARDED_WINS,
    });
  }
}

export { ClaimArenaWin };
