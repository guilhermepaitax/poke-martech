"use client";

import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type { ArenaMatchup } from "@/lib/arena/fighter";
import type { ArenaMode } from "@/lib/arena/tutorial";

import { ArenaActionButton } from "./arena-action-button";
import { ArenaAttackBar } from "./arena-attack-bar";
import { ArenaHud } from "./arena-hud";
import { ArenaOverlay } from "./arena-overlay";
import { ArenaTitleCard } from "./arena-title-card";
import { ArenaTutorial } from "./arena-tutorial";
import { useArenaGame } from "./use-arena-game";

function ArenaGame({
  matchup,
  difficulty,
  mode = "match",
  onExit,
  onTutorialEnd = onExit,
}: {
  matchup: ArenaMatchup;
  difficulty: ArenaDifficulty;
  mode?: ArenaMode;
  onExit: () => void;
  // Sai do treino direto para a luta valendo (pular ou "Lutar agora").
  onTutorialEnd?: () => void;
}) {
  const { parentRef, phase, status, snapshot, hud, reward, tutorialStep, resume, restart, retry } =
    useArenaGame(matchup, difficulty, mode);

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
          {mode === "tutorial" ? (
            <ArenaTutorial
              step={tutorialStep}
              fighter={matchup.player}
              onSkip={onTutorialEnd}
              onFight={onTutorialEnd}
              onRepeat={restart}
              onExit={onExit}
            />
          ) : null}
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
            <div className="arena-title-panel flex flex-col gap-3 p-4">
              <ArenaActionButton onClick={retry}>Tentar de novo</ArenaActionButton>
              <ArenaActionButton variant="secondary" onClick={onExit}>
                Voltar
              </ArenaActionButton>
            </div>
          </ArenaTitleCard>
        </div>
      ) : null}
      {status === "ready" ? (
        <ArenaOverlay
          phase={phase}
          matchup={matchup}
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
