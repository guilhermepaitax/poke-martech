"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBooster, fetchBoosters, openBooster } from "@/services/catalog";
import { profileKeys } from "@/hooks/use-profile";
import { pokedexKeys } from "@/hooks/use-pokedex";

const boosterKeys = {
  all: ["boosters"] as const,
  list: () => [...boosterKeys.all, "list"] as const,
  detail: (slug: string) => [...boosterKeys.all, "detail", slug] as const,
};

function useBoosters() {
  return useQuery({ queryKey: boosterKeys.list(), queryFn: fetchBoosters });
}

function useBooster(slug: string) {
  return useQuery({ queryKey: boosterKeys.detail(slug), queryFn: () => fetchBooster(slug) });
}

function useOpenBooster(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => openBooster(slug),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: profileKeys.me() });
      void client.invalidateQueries({ queryKey: pokedexKeys.all });
      void client.invalidateQueries({ queryKey: boosterKeys.detail(slug) });
    },
  });
}

export { boosterKeys, useBooster, useBoosters, useOpenBooster };
