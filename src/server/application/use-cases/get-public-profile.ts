import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { PublicProfile } from "@/types/catalog";

class GetPublicProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly follows: FollowRepository,
  ) {}

  async execute(
    input: { username: string },
    actor: Actor | null,
  ): Promise<Result<PublicProfile>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const profile = await this.profiles.findPublicByUsername(input.username.toLowerCase());
    if (!profile) return err(new NotFoundError("Perfil"));
    const isSelf = profile.id === auth.value.id;
    const [counts, isFollowing] = await Promise.all([
      this.follows.counts(profile.id),
      isSelf ? false : this.follows.isFollowing(auth.value.id, profile.id),
    ]);
    return success({
      username: profile.username,
      name: profile.name,
      image: profile.image,
      bio: profile.bio,
      isSelf,
      isFollowing,
      followerCount: counts.followers,
      followingCount: counts.following,
    });
  }
}

export { GetPublicProfile };
