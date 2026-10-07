"use client";

import { useQuery } from "@tanstack/react-query";
import type { EnergyType } from "@/lib/value-objects/card";
import { fetchPokemonTypes } from "@/services/catalog";
import type { PokemonType } from "@/types/catalog";

const pokemonTypeKeys = {
  all: ["pokemon-types"] as const,
};

function usePokemonTypes() {
  return useQuery({ queryKey: pokemonTypeKeys.all, queryFn: fetchPokemonTypes });
}

function pokemonTypeName(types: PokemonType[] | undefined, code: EnergyType) {
  return types?.find((type) => type.code === code)?.name ?? code;
}

function useTypeName(code: EnergyType) {
  const types = usePokemonTypes();
  return pokemonTypeName(types.data, code);
}

export { pokemonTypeKeys, pokemonTypeName, usePokemonTypes, useTypeName };
