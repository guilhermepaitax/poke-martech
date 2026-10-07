"use client";

import { Button } from "@/components/ui/button";
import { canPay } from "@/lib/battle/energy-cost";
import { TYPE_APPEARANCE } from "@/lib/type-appearance";
import type { BattlePokemonView } from "@/types/battle";

function BattleActionSheet({
  pokemon,
  canAttack,
  canRetreat,
  onAttack,
  onRetreat,
  onClose,
}: {
  pokemon: BattlePokemonView;
  canAttack: boolean;
  canRetreat: boolean;
  onAttack: (index: number) => void;
  onRetreat: () => void;
  onClose: () => void;
}) {
  return (
    <div data-slot="battle-action-sheet" className="glass absolute inset-x-4 bottom-28 z-20 flex flex-col gap-2 rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{pokemon.card.name}</p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {pokemon.card.attacks.map((attack, index) => {
          const ready = canPay(pokemon.energies, attack.energyCost);
          return (
            <li key={`${attack.name}-${index}`}>
              <button
                type="button"
                disabled={!canAttack || !ready}
                onClick={() => onAttack(index)}
                className="flex w-full items-center justify-between rounded-2xl bg-white/60 px-3 py-2 text-left disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <span className="flex">
                    {attack.energyCost.flatMap((cost) =>
                      Array.from({ length: cost.count }, (_, inner) => {
                        const Icon = TYPE_APPEARANCE[cost.type].icon;
                        return <Icon key={`${cost.type}-${inner}`} className="size-4" style={{ color: TYPE_APPEARANCE[cost.type].color }} />;
                      }),
                    )}
                  </span>
                  <span className="font-semibold">{attack.name}</span>
                </span>
                <span className="tabular-nums font-bold">{attack.damage ?? ""}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button variant="outline" disabled={!canRetreat} onClick={onRetreat}>
        Recuar
      </Button>
    </div>
  );
}

export { BattleActionSheet };
