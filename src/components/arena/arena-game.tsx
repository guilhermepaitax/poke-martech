"use client";

import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";

import { ArenaOverlay } from "./arena-overlay";
import { useArenaGame } from "./use-arena-game";

function ArenaGame({
  matchup,
  difficulty,
  onExit,
}: {
  matchup: ArenaMatchup;
  difficulty: ArenaDifficulty;
  onExit: () => void;
}) {
  const { parentRef, phase, resume, restart } = useArenaGame(matchup, difficulty);

  return (
    <div data-slot="arena-game-frame" className="relative h-full w-full">
      <div
        ref={parentRef}
        data-slot="arena-game"
        className="h-full w-full overflow-hidden bg-muted [&_canvas]:block [&_canvas]:outline-none"
      />
      <ArenaOverlay
        phase={phase}
        onResume={resume}
        onRestart={restart}
        onExit={onExit}
      />
    </div>
  );
}

export { ArenaGame };
