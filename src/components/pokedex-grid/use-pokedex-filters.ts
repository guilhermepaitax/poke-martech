"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePokemonTypes } from "@/hooks/use-pokemon-types";
import { ENERGY_TYPES, RARITY_RANK, type EnergyType } from "@/lib/value-objects/card";
import type { PokedexEntry, PokemonType } from "@/types/catalog";
import { pokedexFiltersFromSearch, pokedexListHref, type SortKey } from "./pokedex-filter-params";

function usePokedexFilters(entries: PokedexEntry[]) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalog = usePokemonTypes();
  const types: PokemonType[] = catalog.data?.length
    ? catalog.data
    : ENERGY_TYPES.map((code) => ({ code, name: code }));
  const search = searchParams.toString();
  const { query, type, sort } = useMemo(
    () => pokedexFiltersFromSearch(new URLSearchParams(search)),
    [search],
  );
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  if (draftQuery !== null && draftQuery === query) setDraftQuery(null);
  const shownQuery = draftQuery ?? query;

  const visible = useMemo(() => {
    const term = shownQuery.trim().toLowerCase();
    return entries
      .filter((entry) => {
        const face = entry.card;
        if (!face) return type === "all" && !term;
        if (type !== "all" && face.energyType !== type) return false;
        if (!term) return true;
        return face.name.toLowerCase().includes(term);
      })
      .sort((left, right) => {
        if (sort === "number") return left.number - right.number;
        if (!left.card && !right.card) return left.number - right.number;
        if (!left.card) return 1;
        if (!right.card) return -1;
        if (sort === "hp") return right.card.hp - left.card.hp;
        if (sort === "rarity") return RARITY_RANK[right.card.rarity] - RARITY_RANK[left.card.rarity];
        return left.card.name.localeCompare(right.card.name, "pt-BR");
      });
  }, [entries, shownQuery, sort, type]);

  const owned = entries.filter((entry) => entry.ownedCount > 0).length;

  function commit(next: { query?: string; type?: EnergyType | "all"; sort?: SortKey }) {
    router.replace(
      pokedexListHref(pathname, searchParams, {
        query: next.query ?? shownQuery,
        type: next.type ?? type,
        sort: next.sort ?? sort,
      }),
      { scroll: false },
    );
  }

  return {
    query: shownQuery,
    setQuery: (value: string) => {
      setDraftQuery(value);
      commit({ query: value });
    },
    type,
    setType: (value: EnergyType | "all") => commit({ type: value }),
    sort,
    setSort: (value: SortKey) => commit({ sort: value }),
    visible,
    owned,
    total: entries.length,
    types,
  };
}

export { usePokedexFilters };
export type { SortKey };
