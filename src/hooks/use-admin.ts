"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBooster,
  createCard,
  fetchAdminBooster,
  fetchAdminBoosters,
  fetchAdminCard,
  fetchAdminCards,
  fetchCardGeneration,
  fetchCardGenerations,
  fetchRarities,
  retryCardGeneration,
  saveRarities,
  startCardGeneration,
  updateBooster,
  updateCard,
} from "@/services/catalog";
import {
  createOpponent,
  fetchAdminOpponent,
  fetchAdminOpponents,
  updateOpponent,
} from "@/services/battle";
import type { BattleOpponentInput } from "@/types/battle";
import type { BoosterInput, CardGenerationInput, CardInput, RarityWeight } from "@/types/catalog";

const adminCardKeys = {
  all: ["admin-cards"] as const,
  list: () => [...adminCardKeys.all, "list"] as const,
  detail: (id: string) => [...adminCardKeys.all, id] as const,
};

function useAdminCards() {
  return useQuery({ queryKey: adminCardKeys.list(), queryFn: fetchAdminCards });
}

function useAdminCard(id: string) {
  return useQuery({
    queryKey: adminCardKeys.detail(id),
    queryFn: () => fetchAdminCard(id),
    enabled: Boolean(id),
  });
}

function useSaveCard(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CardInput) => (id ? updateCard(id, input) : createCard(input)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminCardKeys.all });
    },
  });
}

const adminBoosterKeys = {
  all: ["admin-boosters"] as const,
  list: () => [...adminBoosterKeys.all, "list"] as const,
  detail: (id: string) => [...adminBoosterKeys.all, id] as const,
};

function useAdminBoosters() {
  return useQuery({ queryKey: adminBoosterKeys.list(), queryFn: fetchAdminBoosters });
}

function useAdminBooster(id: string) {
  return useQuery({
    queryKey: adminBoosterKeys.detail(id),
    queryFn: () => fetchAdminBooster(id),
    enabled: Boolean(id),
  });
}

function useSaveBooster(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: BoosterInput) =>
      id ? updateBooster(id, input) : createBooster(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminBoosterKeys.all });
    },
  });
}

const rarityKeys = {
  all: ["rarities"] as const,
};

function useRarities() {
  return useQuery({ queryKey: rarityKeys.all, queryFn: fetchRarities });
}

function useSaveRarities() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: RarityWeight[]) => saveRarities(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: rarityKeys.all });
    },
  });
}

const cardGenerationKeys = {
  all: ["card-generations"] as const,
  list: () => [...cardGenerationKeys.all, "list"] as const,
  detail: (id: string) => [...cardGenerationKeys.all, id] as const,
};

const GENERATION_POLL_MS = 3000;

function useCardGenerations() {
  return useQuery({ queryKey: cardGenerationKeys.list(), queryFn: fetchCardGenerations });
}

function useCardGeneration(id: string) {
  const client = useQueryClient();
  return useQuery({
    queryKey: cardGenerationKeys.detail(id),
    queryFn: async () => {
      const detail = await fetchCardGeneration(id);
      if (detail.status === "completed" || detail.status === "failed") {
        void client.invalidateQueries({ queryKey: adminCardKeys.all });
        void client.invalidateQueries({ queryKey: cardGenerationKeys.list() });
      }
      return detail;
    },
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? GENERATION_POLL_MS : false;
    },
  });
}

function useStartCardGeneration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CardGenerationInput) => startCardGeneration(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: cardGenerationKeys.list() });
    },
  });
}

function useRetryCardGeneration(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => retryCardGeneration(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: cardGenerationKeys.all });
    },
  });
}

const adminOpponentKeys = {
  all: ["admin-opponents"] as const,
  list: () => [...adminOpponentKeys.all, "list"] as const,
  detail: (id: string) => [...adminOpponentKeys.all, id] as const,
};

function useAdminOpponents() {
  return useQuery({ queryKey: adminOpponentKeys.list(), queryFn: fetchAdminOpponents });
}

function useAdminOpponent(id: string) {
  return useQuery({
    queryKey: adminOpponentKeys.detail(id),
    queryFn: () => fetchAdminOpponent(id),
    enabled: Boolean(id),
  });
}

function useSaveOpponent(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: BattleOpponentInput) =>
      id ? updateOpponent(id, input) : createOpponent(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminOpponentKeys.all });
    },
  });
}

export {
  useAdminBooster,
  useAdminBoosters,
  useAdminCard,
  useAdminCards,
  useAdminOpponent,
  useAdminOpponents,
  useCardGeneration,
  useCardGenerations,
  useRarities,
  useRetryCardGeneration,
  useSaveBooster,
  useSaveCard,
  useSaveOpponent,
  useSaveRarities,
  useStartCardGeneration,
};
