import type { PokedexEntry, Profile } from "@/types/catalog";

interface ProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>;
  findPublicByUsername(
    username: string,
  ): Promise<{ id: string; username: string; name: string; image: string | null; bio: string } | null>;
}

interface PokedexRepository {
  listForUser(userId: string): Promise<PokedexEntry[]>;
}

export type { PokedexRepository, ProfileRepository };
