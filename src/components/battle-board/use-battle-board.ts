"use client";

import { useState } from "react";
import type { BattleAction } from "@/lib/battle/battle-action";
import type { BattleEvent } from "@/lib/battle/battle-event";
import { useBattle, useForfeitBattle, useSubmitBattleAction } from "@/hooks/use-battle";
import type { BattleView } from "@/types/battle";

type Selection =
  | { kind: "none" }
  | { kind: "energy" }
  | { kind: "hand"; uid: string }
  | { kind: "pokemon"; uid: string };

function useBattleBoard(id: string) {
  const query = useBattle(id);
  const submit = useSubmitBattleAction(id);
  const forfeit = useForfeitBattle(id);
  const [selection, setSelection] = useState<Selection>({ kind: "none" });
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const battle = query.data;

  function play(action: BattleAction) {
    if (!battle || submit.isPending) return;
    submit.mutate(
      { version: battle.version, action },
      {
        onSuccess: (result) => {
          setEvents(result.events);
          setSelection({ kind: "none" });
        },
      },
    );
  }

  function hasAction(match: (action: BattleAction) => boolean) {
    return Boolean(battle?.legalActions.some(match));
  }

  function selectHand(uid: string) {
    if (!battle) return;
    const playBasic = battle.legalActions.find((action) => action.type === "play_basic" && action.handUid === uid);
    if (playBasic) {
      play(playBasic);
      return;
    }
    setSelection({ kind: "hand", uid });
  }

  function selectPokemon(uid: string) {
    if (!battle) return;
    if (battle.phase === "promote" && hasAction((action) => action.type === "promote" && action.benchUid === uid)) {
      play({ type: "promote", benchUid: uid });
      return;
    }
    if (selection.kind === "energy" && hasAction((action) => action.type === "attach_energy" && action.targetUid === uid)) {
      play({ type: "attach_energy", targetUid: uid });
      return;
    }
    if (selection.kind === "hand") {
      const evolve = battle.legalActions.find(
        (action) => action.type === "evolve" && action.handUid === selection.uid && action.targetUid === uid,
      );
      if (evolve) {
        play(evolve);
        return;
      }
    }
    setSelection({ kind: "pokemon", uid });
  }

  return {
    battle,
    isLoading: query.isLoading,
    isError: query.isError,
    selection,
    setSelection,
    events,
    play,
    selectHand,
    selectPokemon,
    pending: submit.isPending || forfeit.isPending,
    error: submit.error ?? forfeit.error,
    forfeit: () => {
      if (battle) forfeit.mutate(battle.version);
    },
    myTurn: Boolean(battle && battle.status === "active" && (battle.legalActions.length > 0 || battle.phase === "setup")),
  };
}

function latestDamage(events: BattleEvent[]) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.type === "damage") return event;
  }
  return undefined;
}

export { latestDamage, useBattleBoard };
export type { BattleView, Selection };
