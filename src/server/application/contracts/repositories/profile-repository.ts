import type { EnergyType } from "@/lib/value-objects/card";
import type { PokedexSortKey } from "@/lib/value-objects/pokedex";
import type { PageRequest, PageSlice } from "@/server/application/page";
import type { PokedexEntry, ProfileBase } from "@/types/catalog";

interface ProfileRepository {
  findByUserId(userId: string): Promise<ProfileBase | null>;
  findPublicByUsername(
    username: string,
  ): Promise<{ id: string; username: string; name: string; image: string | null; bio: string } | null>;
}

type PokedexFilters = {
  query: string;
  type: EnergyType | null;
  sort: PokedexSortKey;
  ownedOnly: boolean;
};

interface PokedexRepository {
  listForUser(userId: string): Promise<PokedexEntry[]>;
  page(userId: string, filters: PokedexFilters, request: PageRequest): Promise<PageSlice<PokedexEntry>>;
  totals(userId: string): Promise<{ owned: number; total: number }>;
  ownedCardIdsAmong(userId: string, cardIds: string[]): Promise<string[]>;
}

export type { PokedexFilters, PokedexRepository, ProfileRepository };
