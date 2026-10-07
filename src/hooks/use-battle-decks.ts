"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDeck,
  deleteDeck,
  fetchDeck,
  fetchDecks,
  updateDeck,
} from "@/services/battle";
import type { BattleDeckInput } from "@/types/battle";

const deckKeys = {
  all: ["battle-decks"] as const,
  list: () => [...deckKeys.all, "list"] as const,
  detail: (id: string) => [...deckKeys.all, id] as const,
};

function useBattleDecks() {
  return useQuery({ queryKey: deckKeys.list(), queryFn: fetchDecks });
}

function useBattleDeck(id: string) {
  return useQuery({
    queryKey: deckKeys.detail(id),
    queryFn: () => fetchDeck(id),
    enabled: Boolean(id),
  });
}

function useSaveDeck(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: BattleDeckInput) => (id ? updateDeck(id, input) : createDeck(input)),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: deckKeys.all });
    },
  });
}

function useDeleteDeck() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeck(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: deckKeys.all });
    },
  });
}

export { deckKeys, useBattleDeck, useBattleDecks, useDeleteDeck, useSaveDeck };
