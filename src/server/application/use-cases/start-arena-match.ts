import type { ArenaDifficulty } from "@/lib/arena/cpu";
import { ARENA_DAILY_REWARDED_WINS, arenaDayStart } from "@/lib/arena/rewards";
import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { ArenaMatchRepository } from "@/server/application/contracts/repositories/arena-match-repository";
import { success, type Result } from "@/server/shared/result";
import type { ArenaMatchStart } from "@/types/catalog";

class StartArenaMatch {
  constructor(
    private readonly matches: ArenaMatchRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: { difficulty: ArenaDifficulty },
    actor: Actor | null,
  ): Promise<Result<ArenaMatchStart>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const dailyLimit = ARENA_DAILY_REWARDED_WINS;
    const rewardedToday = await this.matches.countRewardedSince(
      auth.value.id,
      arenaDayStart(this.now()),
    );
    if (rewardedToday >= dailyLimit) return success({ matchId: null, rewardedToday, dailyLimit });
    const match = await this.matches.start(auth.value.id, input.difficulty);
    return success({ matchId: match.id, rewardedToday, dailyLimit });
  }
}

export { StartArenaMatch };
