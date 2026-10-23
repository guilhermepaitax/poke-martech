"use client";

import { ARENA_FIGHTERS } from "@/lib/arena/fighters";
import { ARENA_MAPS } from "@/lib/arena/maps";
import type { ArenaSelection } from "@/lib/arena/selection";
import type { ArenaMode } from "@/lib/arena/tutorial";
import dynamic from "next/dynamic";

import { unlockArenaAudio } from "@/game/arena/unlock-audio";

import { useArenaCanvasLayout } from "./arena-canvas-layout";
import { ArenaMapPicker } from "./arena-map-picker";
import { ArenaPicker } from "./arena-picker";
import { ArenaTitleCard } from "./arena-title-card";
import { useArenaPicker } from "./use-arena-picker";
import { useArenaTutorial } from "./use-arena-tutorial";

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
  const tutorial = useArenaTutorial();

  // Primeira luta passa pelo treino antes.
  function chooseMap(mode: ArenaMode = tutorial.done ? "match" : "tutorial") {
    picker.openMaps(mode);
  }

  function start() {
    if (!picker.fight()) return;
    unlockArenaAudio();
    canvas.setActive(true);
  }

  function endTutorial() {
    tutorial.markDone();
    picker.setMode("match");
  }

  function exit() {
    picker.reset();
    picker.backToFighters();
    canvas.setActive(false);
  }

  if (picker.matchup) {
    return (
      <section
        data-slot="arena-screen"
        className="box-border h-full w-full overflow-hidden border-4 border-[#e17100]"
      >
        <ArenaGame
          key={picker.mode}
          matchup={picker.matchup}
          difficulty={picker.difficulty}
          mode={picker.mode}
          onExit={exit}
          onTutorialEnd={endTutorial}
        />
      </section>
    );
  }

  if (picker.step === "map") {
    return (
      <section data-slot="arena-screen">
        <ArenaMapPicker
          maps={ARENA_MAPS}
          map={picker.map}
          random={picker.randomMap}
          player={picker.player}
          opponent={picker.opponent}
          fighterRandom={picker.random}
          mode={picker.mode}
          onChoose={picker.chooseMap}
          onBack={picker.backToFighters}
          onFight={start}
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
        random={picker.random}
        focused={picker.focused}
        active={picker.active}
        onChoose={picker.choose}
        onActivate={picker.activate}
        onFight={() => chooseMap()}
        onTutorial={() => chooseMap("tutorial")}
        canFight={picker.canFight}
        difficulty={picker.difficulty}
        onDifficulty={picker.setDifficulty}
      />
    </section>
  );
}

export { ArenaScreen };
