import { COOLDOWN_MS, type AttackKind } from "@/lib/arena/combat";
import type { ArenaFighter } from "@/lib/arena/fighter";
import { Swords } from "lucide-react";

import { ArenaPanelSection } from "./arena-panel-section";
import { fighterAppearance } from "./fighter-appearance";

const HP_SCALE = 100;
const ATTACK_ORDER: AttackKind[] = ["melee", "fire"];
const ATTACK_RANGE_LABEL: Record<AttackKind, string> = {
  melee: "Corpo a corpo",
  fire: "À distância",
};

function formatCooldown(ms: number) {
  return `${(ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}s`;
}

function FighterStats({ fighter }: { fighter: ArenaFighter }) {
  const TypeIcon = fighterAppearance(fighter.energy).icon;

  return (
    <ArenaPanelSection title="Status" aria-live="polite">
      <p className="text-sm text-(--picker-ink-subtle)">{fighter.description}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs font-semibold tracking-wide text-(--picker-ink-subtle) uppercase">
          <span>HP</span>
          <span className="text-sm text-(--picker-ink) tabular-nums">{fighter.hp}</span>
        </div>
        <div
          role="meter"
          aria-label={`HP de ${fighter.name}`}
          aria-valuemin={0}
          aria-valuemax={HP_SCALE}
          aria-valuenow={fighter.hp}
          className="arena-picker-meter h-2 overflow-hidden"
        >
          <div
            className="arena-picker-meter-fill h-full transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(fighter.hp / HP_SCALE, 1) * 100}%` }}
          />
        </div>
      </div>
      <ul className="flex flex-col">
        {ATTACK_ORDER.map((kind, index) => {
          const attack = fighter.attacks[kind];
          const Icon = kind === "melee" ? Swords : TypeIcon;
          return (
            <li
              key={kind}
              className="flex items-center gap-3 border-b border-dashed border-(--picker-line) py-2.5 last:border-b-0"
            >
              <span className="arena-picker-key flex size-9 shrink-0 items-center justify-center">
                <Icon aria-hidden className="size-4.5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <kbd className="rounded-sm bg-(--picker-line) px-1.5 text-[11px] leading-4 text-(--picker-ink-subtle)">
                    {index + 1}
                  </kbd>
                  <span className="truncate">{attack.name}</span>
                </span>
                <span className="text-xs text-(--picker-ink-subtle)">
                  {ATTACK_RANGE_LABEL[kind]} · recarga {formatCooldown(COOLDOWN_MS[kind])}
                </span>
              </div>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-[10px] font-semibold tracking-wide text-(--picker-ink-subtle) uppercase">
                  Poder
                </span>
                <span className="font-arena-title text-lg leading-none tabular-nums">
                  {attack.power}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </ArenaPanelSection>
  );
}

export { FighterStats };
