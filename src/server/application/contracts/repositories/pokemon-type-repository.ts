import type { PokemonType } from "@/server/application/entities/pokemon-type";

interface PokemonTypeRepository {
  list(): Promise<PokemonType[]>;
}

export type { PokemonTypeRepository };
