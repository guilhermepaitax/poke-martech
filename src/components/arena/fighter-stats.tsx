import { COOLDOWN_MS, type AttackKind } from "@/lib/arena/combat";
import type { ArenaFighter } from "@/lib/arena/fighter";
import { cn } from "@/lib/utils";
import { Dices, Swords, type LucideIcon } from "lucide-react";

import { ArenaPanelSection } from "./arena-panel-section";
import { fighterAppearance } from "./fighter-appearance";
import { RANDOM_FIGHTER } from "./random-fighter";

const HP_SCALE = 100;
const ATTACK_ORDER: AttackKind[] = ["melee", "fire"];
const ATTACK_RANGE_LABEL: Record<AttackKind, string> = {
  melee: "Corpo a corpo",
  fire: "À distância",
};

function formatCooldown(ms: number) {
  return `${(ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}s`;
}

type StatsView = {
  description: string;
  hpLabel: string;
  hp: number;
  // Preenchimento do medidor, em %.
  meter: number;
  meterLabel: string;
  random: boolean;
  attacks: Record<
    AttackKind,
    { name: string; power: string; icon: LucideIcon }
  >;
};

function fighterView(fighter: ArenaFighter): StatsView {
  const TypeIcon = fighterAppearance(fighter.energy).icon;
  return {
    description: fighter.description,
    hpLabel: `${fighter.hp}`,
    hp: fighter.hp,
    meter: Math.min(fighter.hp / HP_SCALE, 1) * 100,
    meterLabel: `HP de ${fighter.name}`,
    random: false,
    attacks: {
      melee: {
        name: fighter.attacks.melee.name,
        power: `${fighter.attacks.melee.power}`,
        icon: Swords,
      },
      fire: {
        name: fighter.attacks.fire.name,
        power: `${fighter.attacks.fire.power}`,
        icon: TypeIcon,
      },
    },
  };
}

function randomView(): StatsView {
  const { stats } = RANDOM_FIGHTER;
  const attack = (kind: AttackKind) => ({
    ...stats.attacks[kind],
    icon: Dices,
  });
  return {
    description: stats.description,
    hpLabel: stats.hp,
    hp: 0,
    meter: stats.meter,
    meterLabel: "HP do lutador sorteado",
    random: true,
    attacks: { melee: attack("melee"), fire: attack("fire") },
  };
}

// `fighter` nulo = escolha aleatória: mesmo layout, valores ocultos.
function FighterStats({ fighter }: { fighter: ArenaFighter | null }) {
  const view = fighter ? fighterView(fighter) : randomView();

  return (
    <ArenaPanelSection title="Status" aria-live="polite">
      {/* Altura fixa de 2 linhas: trocar de lutador não muda o tamanho do painel. */}
      <p
        title={view.description}
        className="line-clamp-2 min-h-[2lh] text-sm text-(--arena-ink-subtle)"
      >
        {view.description}
      </p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs font-semibold tracking-wide text-(--arena-ink-subtle) uppercase">
          <span>HP</span>
          <span className="text-sm text-(--arena-ink) tabular-nums">
            {view.hpLabel}
          </span>
        </div>
        <div
          role="meter"
          aria-label={view.meterLabel}
          aria-valuemin={0}
          aria-valuemax={HP_SCALE}
          aria-valuenow={view.random ? undefined : view.hp}
          aria-valuetext={view.hpLabel}
          className="arena-picker-meter h-2 overflow-hidden"
        >
          <div
            className={cn(
              "arena-picker-meter-fill h-full transition-[width,opacity] duration-500 ease-out",
              view.random && "opacity-50",
            )}
            style={{ width: `${view.meter}%` }}
          />
        </div>
      </div>
      <ul className="flex flex-col">
        {ATTACK_ORDER.map((kind, index) => {
          const attack = view.attacks[kind];
          const Icon = attack.icon;
          return (
            <li
              key={kind}
              className="flex items-center gap-3 border-b border-dashed border-(--arena-line) py-2.5 last:border-b-0"
            >
              <span className="arena-picker-key flex size-9 shrink-0 items-center justify-center">
                <Icon aria-hidden className="size-4.5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <kbd className="rounded-sm bg-(--arena-line) px-1.5 text-[11px] leading-4 text-(--arena-ink-subtle)">
                    {index + 1}
                  </kbd>
                  <span className="truncate">{attack.name}</span>
                </span>
                <span className="text-xs text-(--arena-ink-subtle)">
                  {ATTACK_RANGE_LABEL[kind]} · recarga{" "}
                  {formatCooldown(COOLDOWN_MS[kind])}
                </span>
              </div>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-[10px] font-semibold tracking-wide text-(--arena-ink-subtle) uppercase">
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
