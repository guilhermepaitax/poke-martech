import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { Profile } from "@/types/catalog";

class GetMyProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(actor: Actor | null): Promise<Result<Profile>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const profile = await this.profiles.findByUserId(auth.value.id);
    if (!profile) return err(new NotFoundError("Perfil"));
    return success(profile);
  }
}

export { GetMyProfile };
