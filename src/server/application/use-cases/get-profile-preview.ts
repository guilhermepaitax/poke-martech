import { USERNAME_PATTERN } from "@/lib/auth-form-errors";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { ProfilePreview } from "@/types/catalog";

class GetProfilePreview {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly follows: FollowRepository,
  ) {}

  async execute(input: { username: string }): Promise<Result<ProfilePreview>> {
    const username = input.username.toLowerCase();
    if (!USERNAME_PATTERN.test(username)) return err(new NotFoundError("Perfil"));
    const profile = await this.profiles.findPublicByUsername(username);
    if (!profile) return err(new NotFoundError("Perfil"));
    const counts = await this.follows.counts(profile.id);
    return success({
      username: profile.username,
      name: profile.name,
      image: profile.image,
      bio: profile.bio,
      followerCount: counts.followers,
      followingCount: counts.following,
    });
  }
}

export { GetProfilePreview };
