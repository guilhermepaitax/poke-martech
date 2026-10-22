"use client";

import type { ArenaMatchup } from "@/lib/arena/fighter";
import { Play, RotateCcw, Swords } from "lucide-react";

import { ArenaActionButton } from "./arena-action-button";
import { ArenaRewardPanel } from "./arena-reward-panel";
import { ArenaTitleCard, type ArenaTitleTone } from "./arena-title-card";
import type { ArenaPhase, ArenaReward } from "./use-arena-game";

const TITLES: Record<
  Exclude<ArenaPhase, "playing">,
  { title: string; accent: string; tone: ArenaTitleTone }
> = {
  paused: { title: "Jogo", accent: "pausado", tone: "neutral" },
  victory: { title: "Vitória", accent: "!", tone: "victory" },
  defeat: { title: "Derrota", accent: "!", tone: "defeat" },
};

function ArenaOverlay({
  phase,
  matchup,
  reward,
  onResume,
  onRestart,
  onExit,
}: {
  phase: ArenaPhase;
  matchup: ArenaMatchup;
  reward: ArenaReward | null;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  if (phase === "playing") return null;
  const paused = phase === "paused";
  const copy = TITLES[phase];
  const featured = phase === "defeat" ? matchup.opponent : matchup.player;
  const kicker = paused ? "Esc continua a partida" : `${featured.name} venceu`;

  return (
    <div
      data-slot="arena-overlay"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-labelledby="arena-overlay-title"
      className="absolute inset-0 z-10"
    >
      <ArenaTitleCard
        title={copy.title}
        accent={copy.accent}
        kicker={kicker}
        tone={copy.tone}
        fighter={featured}
      >
        <div className="arena-title-panel flex flex-col gap-3 p-4">
          {!paused && reward ? <ArenaRewardPanel reward={reward} /> : null}
          {paused ? (
            <ArenaActionButton autoFocus onClick={onResume}>
              <Play aria-hidden className="size-5" fill="currentColor" />
              Continuar
            </ArenaActionButton>
          ) : null}
          <ArenaActionButton
            autoFocus={!paused}
            variant={paused ? "secondary" : "primary"}
            onClick={onRestart}
          >
            {paused ? (
              <RotateCcw aria-hidden className="size-4" />
            ) : (
              <Swords aria-hidden className="size-5" />
            )}
            {paused ? "Reiniciar" : "Nova batalha"}
          </ArenaActionButton>
          <ArenaActionButton variant="secondary" onClick={onExit}>
            Trocar lutadores
          </ArenaActionButton>
        </div>
      </ArenaTitleCard>
    </div>
  );
}

export { ArenaOverlay };
