"use client";

import { ARENA_FIGHTERS } from "@/lib/arena/fighters";
import type { ArenaSelection } from "@/lib/arena/selection";
import dynamic from "next/dynamic";

import { unlockArenaAudio } from "@/game/arena/unlock-audio";

import { useArenaCanvasLayout } from "./arena-canvas-layout";
import { ArenaPicker } from "./arena-picker";
import { ArenaTitleCard } from "./arena-title-card";
import { useArenaPicker } from "./use-arena-picker";

const ArenaGame = dynamic(
  () => import("./arena-game").then((mod) => mod.ArenaGame),
  {
    ssr: false,
    loading: () => <ArenaGameFallback />,
  },
);

function ArenaGameFallback() {
  return (
    <div
      data-slot="arena-game-loading"
      role="status"
      className="relative h-full w-full"
    >
      <ArenaTitleCard title="Carregando" accent="arena" tone="loading" />
    </div>
  );
}

const DEFAULT_SELECTION: ArenaSelection = {
  playerId: ARENA_FIGHTERS[0]?.id ?? null,
  opponentId: ARENA_FIGHTERS[1]?.id ?? ARENA_FIGHTERS[0]?.id ?? null,
  active: "player",
};

function ArenaScreen() {
  const canvas = useArenaCanvasLayout();
  const picker = useArenaPicker(DEFAULT_SELECTION);

  function start() {
    if (!picker.fight()) return;
    unlockArenaAudio();
    canvas.setActive(true);
  }

  function exit() {
    picker.reset();
    canvas.setActive(false);
  }

  if (picker.matchup) {
    return (
      <section
        data-slot="arena-screen"
        className="box-border h-full w-full overflow-hidden border-4 border-[#e17100]"
      >
        <ArenaGame
          matchup={picker.matchup}
          difficulty={picker.difficulty}
          onExit={exit}
        />
      </section>
    );
  }

  return (
    <section data-slot="arena-screen">
      <ArenaPicker
        fighters={ARENA_FIGHTERS}
        player={picker.player}
        opponent={picker.opponent}
        focused={picker.focused}
        active={picker.active}
        onChoose={picker.choose}
        onActivate={picker.activate}
        onFight={start}
        canFight={picker.canFight}
        difficulty={picker.difficulty}
        onDifficulty={picker.setDifficulty}
      />
    </section>
  );
}

export { ArenaScreen };
