import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import { NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

class UnfollowUser {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly follows: FollowRepository,
  ) {}

  async execute(
    input: { username: string },
    actor: Actor | null,
  ): Promise<Result<{ following: boolean }>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const profile = await this.profiles.findPublicByUsername(input.username.toLowerCase());
    if (!profile) return err(new NotFoundError("Perfil"));
    if (profile.id === auth.value.id) {
      return err(new ValidationError("Você não pode deixar de seguir a si mesmo."));
    }
    await this.follows.delete(auth.value.id, profile.id);
    return success({ following: false });
  }
}

export { UnfollowUser };
