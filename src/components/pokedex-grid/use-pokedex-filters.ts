"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePokemonTypes } from "@/hooks/use-pokemon-types";
import { ENERGY_TYPES, type EnergyType } from "@/lib/value-objects/card";
import type { PokemonType } from "@/types/catalog";
import { pokedexFiltersFromSearch, pokedexListHref, type SortKey } from "./pokedex-filter-params";

const QUERY_DEBOUNCE_MS = 300;

function usePokedexFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalog = usePokemonTypes();
  const types: PokemonType[] = catalog.data?.length
    ? catalog.data
    : ENERGY_TYPES.map((code) => ({ code, name: code }));
  const search = searchParams.toString();
  const applied = useMemo(
    () => pokedexFiltersFromSearch(new URLSearchParams(search)),
    [search],
  );
  const [draftQuery, setDraftQuery] = useState<string | null>(null);
  if (draftQuery !== null && draftQuery === applied.query) setDraftQuery(null);
  const shownQuery = draftQuery ?? applied.query;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function commit(next: { query?: string; type?: EnergyType | "all"; sort?: SortKey }) {
    if (timer.current) clearTimeout(timer.current);
    router.replace(
      pokedexListHref(pathname, searchParams, {
        query: next.query ?? shownQuery,
        type: next.type ?? applied.type,
        sort: next.sort ?? applied.sort,
      }),
      { scroll: false },
    );
  }

  return {
    applied,
    query: shownQuery,
    setQuery: (value: string) => {
      setDraftQuery(value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => commit({ query: value }), QUERY_DEBOUNCE_MS);
    },
    type: applied.type,
    setType: (value: EnergyType | "all") => commit({ type: value }),
    sort: applied.sort,
    setSort: (value: SortKey) => commit({ sort: value }),
    types,
  };
}

type PokedexFiltersState = ReturnType<typeof usePokedexFilters>;

export { usePokedexFilters };
export type { PokedexFiltersState, SortKey };
