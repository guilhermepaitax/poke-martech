"use client";

import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaFighter } from "@/lib/arena/fighter";
import type { ArenaSide } from "@/lib/arena/selection";
import { GraduationCap, Shuffle, Swords } from "lucide-react";
import type { CSSProperties } from "react";

import { ArenaActionButton } from "./arena-action-button";
import { ArenaDifficultyPicker } from "./arena-difficulty";
import { ArenaPanelSection } from "./arena-panel-section";
import { fighterAppearance } from "./fighter-appearance";
import { FighterBanner } from "./fighter-banner";
import { ArenaMatchupSlots, FighterRoster } from "./fighter-roster";
import { FighterStats } from "./fighter-stats";
import { RANDOM_FIGHTER } from "./random-fighter";

const SIDE_LABEL: Record<ArenaSide, string> = {
  player: "Você",
  opponent: "Oponente",
};

function ArenaPicker({
  fighters,
  player,
  opponent,
  random,
  focused,
  active,
  onChoose,
  onActivate,
  onFight,
  onTutorial,
  canFight,
  difficulty,
  onDifficulty,
}: {
  fighters: readonly ArenaFighter[];
  player: ArenaFighter | null;
  opponent: ArenaFighter | null;
  random: Record<ArenaSide, boolean>;
  focused: ArenaFighter | null;
  active: ArenaSide;
  onChoose: (id: string) => void;
  onActivate: (side: ArenaSide) => void;
  onFight: () => void;
  onTutorial: () => void;
  canFight: boolean;
  difficulty: ArenaDifficulty;
  onDifficulty: (value: ArenaDifficulty) => void;
}) {
  const focusedRandom = random[active];
  const appearance = focused ? fighterAppearance(focused.energy) : null;
  const TypeIcon = focusedRandom ? Shuffle : appearance?.icon;
  const color = focusedRandom ? RANDOM_FIGHTER.color : appearance?.color;
  const style = color ? ({ "--energy": color } as CSSProperties) : undefined;

  return (
    <div
      data-slot="arena-picker"
      style={style}
      className="arena-picker relative isolate overflow-hidden rounded-[28px] lg:grid lg:min-h-[40rem] lg:grid-cols-[minmax(0,1fr)_30rem]"
    >
      <FighterBanner
        fighters={fighters}
        focused={focused}
        random={focusedRandom}
        className="absolute inset-x-0 top-0 -z-10 aspect-[4/3] sm:aspect-video lg:inset-0 lg:aspect-auto"
      />

      <div className="flex aspect-[4/3] flex-col items-start gap-2 p-5 sm:aspect-video sm:p-8 lg:aspect-auto">
        <span className="arena-tab font-arena-title px-3 py-1 text-[11px] leading-none tracking-widest uppercase">
          Escolhendo · {SIDE_LABEL[active]}
        </span>
        {focused || focusedRandom ? (
          <>
            <h1 className="arena-name font-arena-title text-[clamp(2rem,9vw,4rem)] leading-[0.9] uppercase xl:text-7xl">
              {focusedRandom ? RANDOM_FIGHTER.name : focused?.name}
            </h1>
            <p className="arena-name flex items-center gap-2 text-sm font-semibold sm:text-base">
              {TypeIcon ? (
                <TypeIcon aria-hidden className="size-4 text-(--energy)" />
              ) : null}
              {focusedRandom ? RANDOM_FIGHTER.title : focused?.title}
            </p>
          </>
        ) : (
          <h1 className="arena-name font-arena-title text-4xl uppercase sm:text-6xl">
            Escolha um lutador
          </h1>
        )}
      </div>

      <aside className="arena-picker-panel flex flex-col gap-6 p-5 sm:p-6">
        <ArenaMatchupSlots
          player={player}
          opponent={opponent}
          random={random}
          active={active}
          onActivate={onActivate}
        />

        <ArenaPanelSection
          title="Lutadores"
          aside={`para ${SIDE_LABEL[active].toLocaleLowerCase()}`}
        >
          <FighterRoster
            fighters={fighters}
            player={player}
            opponent={opponent}
            random={random}
            active={active}
            onChoose={onChoose}
          />
        </ArenaPanelSection>

        {focused || focusedRandom ? (
          <FighterStats fighter={focusedRandom ? null : focused} />
        ) : null}

        <div className="mt-auto flex flex-col gap-4">
          <ArenaPanelSection title="Dificuldade">
            <ArenaDifficultyPicker
              value={difficulty}
              onValueChange={onDifficulty}
            />
          </ArenaPanelSection>
          <div className="arena-cta-shadow">
            <button
              type="button"
              onClick={onFight}
              disabled={!canFight}
              className="arena-cta flex h-14 w-full items-center justify-center gap-3 font-arena-title text-2xl uppercase focus-visible:outline-none"
            >
              <Swords aria-hidden className="size-6" />
              Lutar
            </button>
          </div>
          <ArenaActionButton
            variant="secondary"
            onClick={onTutorial}
            disabled={!canFight}
          >
            <GraduationCap aria-hidden className="size-4" />
            Tutorial
          </ArenaActionButton>
        </div>
      </aside>
    </div>
  );
}

export { ArenaPicker };
