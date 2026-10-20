"use client";

import type { ArenaRoster } from "@/lib/arena/fighter";
import dynamic from "next/dynamic";

import { unlockArenaAudio } from "@/game/arena/unlock-audio";

import { useArenaCanvasLayout } from "./arena-canvas-layout";
import { ArenaPicker } from "./arena-picker";
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
      className="flex h-full w-full items-center justify-center bg-muted text-sm text-foreground-subtle"
    >
      Carregando arena...
    </div>
  );
}

function ArenaBootError({ message }: { message: string }) {
  return (
    <p data-slot="arena-boot-error" className="text-sm text-foreground-subtle">
      {message}
    </p>
  );
}

function ArenaScreen({
  roster,
  message,
}: {
  roster: ArenaRoster | null;
  message?: string;
}) {
  const canvas = useArenaCanvasLayout();
  const picker = useArenaPicker(
    {
      playerId: roster?.playerId ?? null,
      opponentId: roster?.opponentId ?? null,
      active: "player",
    },
    roster?.fighters ?? [],
  );

  function start() {
    if (!picker.fight()) return;
    unlockArenaAudio();
    canvas.setActive(true);
  }

  function exit() {
    picker.reset();
    canvas.setActive(false);
  }

  if (roster && picker.matchup) {
    return (
      <section
        data-slot="arena-screen"
        className="box-border h-full w-full overflow-hidden border-4 border-amber-400"
      >
        <ArenaGame
          matchup={picker.matchup}
          difficulty={picker.difficulty}
          onExit={exit}
        />
      </section>
    );
  }

  if (!roster) return <ArenaBootError message={message ?? ""} />;

  return (
    <section data-slot="arena-screen">
      <ArenaPicker
        entries={picker.pageItems}
        player={picker.player}
        opponent={picker.opponent}
        active={picker.active}
        query={picker.query}
        onQuery={picker.setQuery}
        page={picker.page}
        pageCount={picker.pageCount}
        onPageChange={picker.setPage}
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
