"use client";

import { useState } from "react";
import { HoloCard } from "@/components/holo-card/holo-card";
import { Button } from "@/components/ui/button";
import { MAX_BENCH } from "@/lib/battle/battle-state";
import { cn } from "@/lib/utils";
import type { BattleView } from "@/types/battle";

function BattleSetup({
  battle,
  onConfirm,
  pending,
}: {
  battle: BattleView;
  onConfirm: (activeUid: string, benchUids: string[]) => void;
  pending: boolean;
}) {
  const basics = (battle.player.hand ?? []).filter((card) => card.stage === "basic");
  const [activeUid, setActiveUid] = useState(basics[0]?.uid ?? "");
  const [bench, setBench] = useState<string[]>([]);

  function toggleBench(uid: string) {
    if (uid === activeUid) return;
    setBench((current) => {
      if (current.includes(uid)) return current.filter((item) => item !== uid);
      if (current.length >= MAX_BENCH) return current;
      return [...current, uid];
    });
  }

  return (
    <div data-slot="battle-setup" className="glass absolute inset-x-4 bottom-6 z-20 flex flex-col gap-3 rounded-3xl p-4">
      <p className="font-semibold">Escolha o Pokémon Ativo e até 3 no banco</p>
      <ul className="flex flex-wrap gap-2">
        {basics.map((card) => (
          <li key={card.uid}>
            <button
              type="button"
              data-active={activeUid === card.uid ? "" : undefined}
              data-bench={bench.includes(card.uid) ? "" : undefined}
              onClick={() => {
                if (activeUid === card.uid) return;
                if (bench.includes(card.uid)) setBench((current) => current.filter((item) => item !== card.uid));
                setActiveUid(card.uid);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                toggleBench(card.uid);
              }}
              className={cn(
                "w-20 rounded-[10%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeUid === card.uid && "ring-2 ring-primary",
                bench.includes(card.uid) && "ring-2 ring-accent",
              )}
            >
              <HoloCard {...card} effects={false} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {basics
          .filter((card) => card.uid !== activeUid)
          .map((card) => (
            <Button
              key={card.uid}
              size="sm"
              variant={bench.includes(card.uid) ? "default" : "outline"}
              onClick={() => toggleBench(card.uid)}
            >
              {bench.includes(card.uid) ? "No banco" : `Banco: ${card.name}`}
            </Button>
          ))}
      </div>
      <Button disabled={pending || !activeUid} onClick={() => onConfirm(activeUid, bench)}>
        Confirmar
      </Button>
    </div>
  );
}

export { BattleSetup };
