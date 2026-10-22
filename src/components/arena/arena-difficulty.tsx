"use client";

import type { ArenaDifficulty } from "@/lib/arena/cpu";
import { Feather, Flame, Shield, type LucideIcon } from "lucide-react";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Fácil", hint: "CPU calma", icon: Feather },
  { value: "normal", label: "Normal", hint: "CPU devagar", icon: Shield },
  { value: "hard", label: "Difícil", hint: "CPU agressiva", icon: Flame },
] as const satisfies readonly { value: ArenaDifficulty; label: string; hint: string; icon: LucideIcon }[];

function ArenaDifficultyPicker({
  value,
  onValueChange,
}: {
  value: ArenaDifficulty;
  onValueChange: (value: ArenaDifficulty) => void;
}) {
  return (
    <div
      data-slot="arena-difficulty"
      role="radiogroup"
      aria-label="Dificuldade da CPU"
      className="grid grid-cols-3 gap-2"
    >
      {DIFFICULTY_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-level={option.value}
            data-selected={selected ? "" : undefined}
            onClick={() => onValueChange(option.value)}
            className="arena-choice flex items-center gap-2 px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arena-cta)"
          >
            <Icon aria-hidden className="arena-choice-icon size-5 shrink-0" />
            <span className="flex min-w-0 flex-col">
              <span className="font-arena-title text-sm leading-tight uppercase">
                {option.label}
              </span>
              <span className="truncate text-[11px] opacity-75">{option.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { ArenaDifficultyPicker };
