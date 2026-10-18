"use client";

import { useArenaGame } from "./use-arena-game";

function ArenaGame() {
  const parentRef = useArenaGame();

  return (
    <div
      ref={parentRef}
      data-slot="arena-game"
      className="h-full w-full overflow-hidden bg-muted [&_canvas]:block [&_canvas]:outline-none"
    />
  );
}

export { ArenaGame };
