"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BattleAction } from "@/lib/battle/battle-action";
import { fetchBattle, fetchBattleHub, forfeitBattle, startBattle, submitBattleAction } from "@/services/battle";
import { deckKeys } from "@/hooks/use-battle-decks";

const battleKeys = {
  all: ["battles"] as const,
  hub: () => [...battleKeys.all, "hub"] as const,
  detail: (id: string) => [...battleKeys.all, id] as const,
};

function useBattleHub() {
  return useQuery({ queryKey: battleKeys.hub(), queryFn: fetchBattleHub });
}

function useBattle(id: string) {
  return useQuery({
    queryKey: battleKeys.detail(id),
    queryFn: () => fetchBattle(id),
    enabled: Boolean(id),
  });
}

function useStartBattle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: startBattle,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: battleKeys.all });
      void client.invalidateQueries({ queryKey: deckKeys.all });
    },
  });
}

function useSubmitBattleAction(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { version: number; action: BattleAction }) => submitBattleAction(id, input),
    onSuccess: (result) => {
      client.setQueryData(battleKeys.detail(id), result.battle);
      void client.invalidateQueries({ queryKey: battleKeys.hub() });
    },
  });
}

function useForfeitBattle(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => forfeitBattle(id, version),
    onSuccess: (battle) => {
      client.setQueryData(battleKeys.detail(id), battle);
      void client.invalidateQueries({ queryKey: battleKeys.hub() });
    },
  });
}

export { battleKeys, useBattle, useBattleHub, useForfeitBattle, useStartBattle, useSubmitBattleAction };
