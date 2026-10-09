import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { ProfileLink } from "@/types/catalog";

class ListFollowing {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly follows: FollowRepository,
  ) {}

  async execute(input: { username: string }, actor: Actor | null): Promise<Result<ProfileLink[]>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const profile = await this.profiles.findPublicByUsername(input.username.toLowerCase());
    if (!profile) return err(new NotFoundError("Perfil"));
    return success(await this.follows.listFollowing(profile.id));
  }
}

export { ListFollowing };
