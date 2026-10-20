const POKEDEX_SORT_KEYS = ["number", "name", "hp", "rarity"] as const;

type PokedexSortKey = (typeof POKEDEX_SORT_KEYS)[number];

function isPokedexSortKey(value: string | null): value is PokedexSortKey {
  return POKEDEX_SORT_KEYS.some((sort) => sort === value);
}

export { isPokedexSortKey, POKEDEX_SORT_KEYS };
export type { PokedexSortKey };
