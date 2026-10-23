"use client";

import { ArenaGame } from "@/components/arena/arena-game";
import { antoniomander } from "@/lib/arena/fighters/antoniomander";
import { calvossauro } from "@/lib/arena/fighters/calvossauro";
import { findFighter } from "@/lib/arena/fighters";
import { DEFAULT_MAP, findMap } from "@/lib/arena/maps";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ?map=<id>&player=<id>&opponent=<id>&zones=1 para conferir mapas e terreno.
function ArenaCheck() {
  const params = useSearchParams();
  const matchup = {
    player: findFighter(params.get("player")) ?? antoniomander,
    opponent: findFighter(params.get("opponent")) ?? calvossauro,
    map: findMap(params.get("map")) ?? DEFAULT_MAP,
  };

  return (
    <div className="fixed inset-0">
      <ArenaGame
        matchup={matchup}
        difficulty="normal"
        onExit={() => window.location.reload()}
      />
    </div>
  );
}

export default function ArenaCheckPage() {
  return (
    <Suspense>
      <ArenaCheck />
    </Suspense>
  );
}
