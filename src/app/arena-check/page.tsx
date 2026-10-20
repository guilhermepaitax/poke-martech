"use client";

import { ArenaGame } from "@/components/arena/arena-game";

const matchup = {
  player: {
    id: "player",
    name: "Ash",
    hp: 80,
    imageUrl: null,
    attackDamage: 30,
  },
  opponent: {
    id: "opponent",
    name: "Gary",
    hp: 70,
    imageUrl: null,
    attackDamage: 20,
  },
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
