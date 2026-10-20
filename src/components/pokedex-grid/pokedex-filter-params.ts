import { isEnergyType, type EnergyType } from "@/lib/value-objects/card";
import { hrefWithQuery } from "@/lib/search-href";
import { isPokedexSortKey, type PokedexSortKey } from "@/lib/value-objects/pokedex";

type SortKey = PokedexSortKey;

type PokedexFilterState = {
  query: string;
  type: EnergyType | "all";
  sort: SortKey;
};

function pokedexFiltersFromSearch(params: URLSearchParams): PokedexFilterState {
  const type = params.get("tipo");
  const sort = params.get("ordem");
  return {
    query: params.get("q") ?? "",
    type: type && isEnergyType(type) ? type : "all",
    sort: isPokedexSortKey(sort) ? sort : "number",
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
