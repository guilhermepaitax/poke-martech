"use client";

import type { ArenaMatchup } from "@/lib/arena/fighter";

import { useArenaGame } from "./use-arena-game";

function ArenaGame({ matchup }: { matchup: ArenaMatchup }) {
  const parentRef = useArenaGame(matchup);

  return (
    <div
      ref={parentRef}
      data-slot="arena-game"
      className="h-full w-full overflow-hidden bg-muted [&_canvas]:block [&_canvas]:outline-none"
    />
  );
}

export { ArenaGame };
