"use client";

import { Button } from "@/components/ui/button";

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
  playerName,
  opponentName,
  reward,
  onResume,
  onRestart,
  onExit,
}: {
  phase: ArenaPhase;
  playerName: string;
  opponentName: string;
  reward: ArenaReward | null;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  if (phase === "playing") return null;
  const paused = phase === "paused";
  const copy = TITLES[phase];
  const kicker = paused
    ? "Esc continua a partida"
    : `${phase === "victory" ? playerName : opponentName} venceu`;

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
      >
        {!paused && reward ? (
          <ArenaRewardPanel reward={reward} className="mb-3" />
        ) : null}
        <div className="glass bg-white/90! flex flex-col gap-2 rounded-3xl p-4">
          {paused ? (
            <Button autoFocus onClick={onResume}>
              Continuar
            </Button>
          ) : null}
          <Button
            autoFocus={!paused}
            variant={paused ? "secondary" : "default"}
            onClick={onRestart}
          >
            {paused ? "Reiniciar" : "Nova batalha"}
          </Button>
          <Button variant="outline" onClick={onExit}>
            Trocar lutadores
          </Button>
        </div>
      </ArenaTitleCard>
    </div>
  );
}

export { ArenaOverlay };
