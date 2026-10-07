type SourcePokemonAttack = {
  name: string;
  cost: string[];
  damage: string | null;
  effect: string | null;
};

type SourcePokemon = {
  externalId: string;
  name: string;
  hp: number | null;
  types: string[];
  stage: string | null;
  description: string | null;
  attacks: SourcePokemonAttack[];
  abilities: { name: string; effect: string }[];
  weaknesses: { type: string; value: string | null }[];
  retreat: number | null;
  rarity: string | null;
  imageUrl: string | null;
};

type CardInspiration = {
  pokemon: SourcePokemon;
  artworkUrl: string | null;
};

export type { CardInspiration, SourcePokemon, SourcePokemonAttack };
