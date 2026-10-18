"use client";

import dynamic from "next/dynamic";

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

function ArenaScreen() {
  return (
    <section
      data-slot="arena-screen"
      className="box-border h-full w-full overflow-hidden border-4 border-amber-400"
    >
      <ArenaGame />
    </section>
  );
}

export { ArenaScreen };
