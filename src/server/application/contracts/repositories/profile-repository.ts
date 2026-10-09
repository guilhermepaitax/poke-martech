import type { PokedexEntry, ProfileBase } from "@/types/catalog";

interface ProfileRepository {
  findByUserId(userId: string): Promise<ProfileBase | null>;
  findPublicByUsername(
    username: string,
  ): Promise<{ id: string; username: string; name: string; image: string | null; bio: string } | null>;
}

interface PokedexRepository {
  listForUser(userId: string): Promise<PokedexEntry[]>;
  ownedCardIds(userId: string): Promise<string[]>;
}

export type { PokedexRepository, ProfileRepository };
