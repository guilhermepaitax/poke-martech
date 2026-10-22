"use client";

import { Button } from "@/components/ui/button";
import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";

import { ArenaAttackBar } from "./arena-attack-bar";
import { ArenaHud } from "./arena-hud";
import { ArenaOverlay } from "./arena-overlay";
import { ArenaTitleCard } from "./arena-title-card";
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
  const { parentRef, phase, status, snapshot, hud, reward, resume, restart, retry } =
    useArenaGame(matchup, difficulty);

  return (
    <div
      data-slot="arena-game-frame"
      data-paused={phase === "paused" ? "" : undefined}
      className="arena-hud-frame relative h-full w-full"
    >
      <div
        ref={parentRef}
        data-slot="arena-game"
        className="h-full w-full overflow-hidden bg-muted [&_canvas]:block [&_canvas]:outline-none"
      />
      {status === "ready" ? (
        <>
          <ArenaHud
            player={matchup.player}
            opponent={matchup.opponent}
            snapshot={snapshot}
            charge={hud?.charge ?? null}
          />
          <ArenaAttackBar fighter={matchup.player} hud={hud} />
        </>
      ) : null}
      {status === "loading" ? (
        <div data-slot="arena-game-loading" role="status" className="absolute inset-0">
          <ArenaTitleCard title="Carregando" accent="arena" tone="loading" />
        </div>
      ) : null}
      {status === "error" ? (
        <div data-slot="arena-boot-error" role="alert" className="absolute inset-0">
          <ArenaTitleCard title="Ops" accent="erro" kicker="Não foi possível iniciar a arena" tone="defeat">
            <div className="glass bg-white/90! flex flex-col gap-2 rounded-3xl p-4">
              <Button onClick={retry}>Tentar de novo</Button>
              <Button variant="outline" onClick={onExit}>
                Voltar
              </Button>
            </div>
          </ArenaTitleCard>
        </div>
      ) : null}
      {status === "ready" ? (
        <ArenaOverlay
          phase={phase}
          playerName={matchup.player.name}
          opponentName={matchup.opponent.name}
          reward={reward}
          onResume={resume}
          onRestart={restart}
          onExit={onExit}
        />
      ) : null}
    </div>
  );
}

export { ArenaGame };
