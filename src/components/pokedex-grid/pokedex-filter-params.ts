import { isEnergyType, type EnergyType } from "@/lib/value-objects/card";
import { hrefWithQuery } from "@/lib/search-href";

const SORT_KEYS = ["number", "name", "hp", "rarity"] as const;

type SortKey = (typeof SORT_KEYS)[number];

type PokedexFilterState = {
  query: string;
  type: EnergyType | "all";
  sort: SortKey;
};

function isSortKey(value: string | null): value is SortKey {
  return SORT_KEYS.some((sort) => sort === value);
}

function pokedexFiltersFromSearch(params: URLSearchParams): PokedexFilterState {
  const type = params.get("tipo");
  const sort = params.get("ordem");
  return {
    query: params.get("q") ?? "",
    type: type && isEnergyType(type) ? type : "all",
    sort: isSortKey(sort) ? sort : "number",
  };
}

function pokedexListHref(
  pathname: string,
  current: URLSearchParams,
  filters: PokedexFilterState,
) {
  return hrefWithQuery(pathname, current, {
    q: filters.query || null,
    tipo: filters.type === "all" ? null : filters.type,
    ordem: filters.sort === "number" ? null : filters.sort,
  });
}

export { pokedexFiltersFromSearch, pokedexListHref };
export type { PokedexFilterState, SortKey };
