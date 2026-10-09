import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import { ConflictError, NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

class FollowUser {
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
      return err(new ValidationError("Você não pode seguir a si mesmo."));
    }
    const already = await this.follows.isFollowing(auth.value.id, profile.id);
    if (already) return err(new ConflictError("Você já segue este treinador."));
    await this.follows.create(auth.value.id, profile.id);
    return success({ following: true });
  }
}

export { FollowUser };
