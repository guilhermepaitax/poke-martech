"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCard, fetchPokedex } from "@/services/catalog";

const pokedexKeys = {
  all: ["pokedex"] as const,
  list: () => [...pokedexKeys.all, "list"] as const,
  detail: (id: string) => [...pokedexKeys.all, "detail", id] as const,
};

function usePokedex() {
  return useQuery({ queryKey: pokedexKeys.list(), queryFn: fetchPokedex });
}

function useCard(id: string) {
  return useQuery({ queryKey: pokedexKeys.detail(id), queryFn: () => fetchCard(id) });
}

export { pokedexKeys, useCard, usePokedex };
