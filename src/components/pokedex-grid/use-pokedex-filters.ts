"use client";

import { useMemo, useState } from "react";
import { usePokemonTypes } from "@/hooks/use-pokemon-types";
import { ENERGY_TYPES, RARITY_RANK, type EnergyType } from "@/lib/value-objects/card";
import type { PokedexEntry, PokemonType } from "@/types/catalog";

type SortKey = "number" | "name" | "hp" | "rarity";

function usePokedexFilters(entries: PokedexEntry[]) {
  const catalog = usePokemonTypes();
  const types: PokemonType[] = catalog.data?.length
    ? catalog.data
    : ENERGY_TYPES.map((code) => ({ code, name: code }));
  const [query, setQuery] = useState("");
  const [type, setType] = useState<EnergyType | "all">("all");
  const [sort, setSort] = useState<SortKey>("number");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
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
  }, [entries, query, sort, type]);

  const owned = entries.filter((entry) => entry.ownedCount > 0).length;

  return {
    query,
    setQuery,
    type,
    setType,
    sort,
    setSort,
    visible,
    owned,
    total: entries.length,
    types,
  };
}

export { usePokedexFilters };
export type { SortKey };
