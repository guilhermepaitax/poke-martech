import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type {
  PokedexRepository,
  ProfileRepository,
} from "@/server/application/contracts/repositories/profile-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { PublicProfile } from "@/types/catalog";

class GetPublicProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly pokedex: PokedexRepository,
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
    const entries = (await this.pokedex.listForUser(profile.id)).filter((entry) => entry.ownedCount > 0);
    const isSelf = profile.id === auth.value.id;
    const owned = isSelf ? null : new Set(await this.pokedex.ownedCardIds(auth.value.id));
    const counts = await this.follows.counts(profile.id);
    const isFollowing = isSelf ? false : await this.follows.isFollowing(auth.value.id, profile.id);
    return success({
      username: profile.username,
      name: profile.name,
      image: profile.image,
      bio: profile.bio,
      isSelf,
      isFollowing,
      followerCount: counts.followers,
      followingCount: counts.following,
      pokedex: entries.map((entry) => ({
        ...entry,
        viewerOwns: isSelf || (owned?.has(entry.id) ?? false),
      })),
    });
  }
}

export { GetPublicProfile };
