import type { SourcePokemon } from "@/server/application/entities/source-pokemon";

type PokemonArtwork = {
  bytes: Uint8Array;
  contentType: string;
};

interface PokemonCardSource {
  fetchByUrl(url: string): Promise<SourcePokemon | null>;
  fetchArtwork(pokemon: SourcePokemon): Promise<PokemonArtwork | null>;
}

export type { PokemonArtwork, PokemonCardSource };
