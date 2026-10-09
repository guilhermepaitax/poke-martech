import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import type { TradeRepository } from "@/server/application/contracts/repositories/trade-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { Profile } from "@/types/catalog";

class GetMyProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly follows: FollowRepository,
    private readonly trades: TradeRepository,
  ) {}

  async execute(actor: Actor | null): Promise<Result<Profile>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const profile = await this.profiles.findByUserId(auth.value.id);
    if (!profile) return err(new NotFoundError("Perfil"));
    const counts = await this.follows.counts(auth.value.id);
    const pendingTrades = await this.trades.pendingIncoming(auth.value.id, 3);
    return success({
      ...profile,
      followerCount: counts.followers,
      followingCount: counts.following,
      pendingTrades,
    });
  }
}

export { GetMyProfile };
