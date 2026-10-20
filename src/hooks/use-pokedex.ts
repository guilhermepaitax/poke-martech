"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchCard,
  fetchPokedex,
  fetchPokedexPage,
  fetchProfileCards,
  type PokedexQuery,
} from "@/services/catalog";

type PokedexSource = { kind: "mine" } | { kind: "profile"; username: string };

const pokedexKeys = {
  all: ["pokedex"] as const,
  list: () => [...pokedexKeys.all, "list"] as const,
  pages: (source: PokedexSource, filters: PokedexQuery) =>
    [...pokedexKeys.all, "pages", source, filters] as const,
  detail: (id: string) => [...pokedexKeys.all, "detail", id] as const,
};

function usePokedex() {
  return useQuery({ queryKey: pokedexKeys.list(), queryFn: fetchPokedex });
}

function useMyPokedexPages(filters: PokedexQuery) {
  return useInfiniteQuery({
    queryKey: pokedexKeys.pages({ kind: "mine" }, filters),
    queryFn: ({ pageParam }) => fetchPokedexPage(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });
}

function useProfileCardPages(username: string, filters: PokedexQuery) {
  return useInfiniteQuery({
    queryKey: pokedexKeys.pages({ kind: "profile", username }, filters),
    queryFn: ({ pageParam }) => fetchProfileCards(username, filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });
}

function useCard(id: string) {
  return useQuery({ queryKey: pokedexKeys.detail(id), queryFn: () => fetchCard(id) });
}

export { pokedexKeys, useCard, useMyPokedexPages, usePokedex, useProfileCardPages };
