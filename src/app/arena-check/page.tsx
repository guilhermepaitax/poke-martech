"use client";

import { ArenaGame } from "@/components/arena/arena-game";
import { antoniomander } from "@/lib/arena/fighters/antoniomander";
import { calvossauro } from "@/lib/arena/fighters/calvossauro";

const matchup = {
  player: antoniomander,
  opponent: calvossauro,
};

export default function ArenaCheckPage() {
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
