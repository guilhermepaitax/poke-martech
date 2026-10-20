"use client";

import { Button } from "@/components/ui/button";

import type { ArenaPhase } from "./use-arena-game";

const TITLES: Record<Exclude<ArenaPhase, "playing">, string> = {
  paused: "Pausado",
  victory: "Vitória",
  defeat: "Derrota",
};

function ArenaOverlay({
  phase,
  onResume,
  onRestart,
  onExit,
}: {
  phase: ArenaPhase;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}) {
  if (phase === "playing") return null;
  const paused = phase === "paused";

  return (
    <div
      data-slot="arena-overlay"
      data-phase={phase}
      className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="arena-overlay-title"
        className="glass bg-white/90! flex w-[min(20rem,calc(100%-2rem))] flex-col gap-5 rounded-3xl p-6 text-center"
      >
        <h2
          id="arena-overlay-title"
          className="text-2xl font-semibold text-foreground"
        >
          {TITLES[phase]}
        </h2>
        {paused ? (
          <p className="text-sm text-foreground-subtle">
            Esc continua a partida.
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
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
            {paused ? "Reiniciar" : "Jogar de novo"}
          </Button>
          <Button variant="outline" onClick={onExit}>
            Encerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ArenaOverlay };
