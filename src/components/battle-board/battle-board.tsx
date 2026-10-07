"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BattleActionSheet } from "./battle-action-sheet";
import { BattleEnergyZone } from "./battle-energy-zone";
import { BattleHand } from "./battle-hand";
import { BattlePokemonSlot } from "./battle-pokemon-slot";
import { BattleForfeitButton, BattleResultDialog } from "./battle-result-dialog";
import { BattleScore } from "./battle-score";
import { BattleSetup } from "./battle-setup";
import { latestDamage, useBattleBoard } from "./use-battle-board";

function BattleBoard({ id }: { id: string }) {
  const board = useBattleBoard(id);
  const battle = board.battle;
  if (board.isLoading) return <p className="text-foreground-subtle">Entrando na arena...</p>;
  if (board.isError || !battle) return <p className="text-destructive">Batalha não encontrada.</p>;
  const selectedPokemon = board.selection.kind === "pokemon" ? board.selection.uid : undefined;
  const activeSelected = selectedPokemon && selectedPokemon === battle.player.active?.uid;
  const damage = latestDamage(board.events);
  const canEnd = battle.legalActions.some((action) => action.type === "end_turn");
  const canRetreat = battle.legalActions.some((action) => action.type === "retreat");
  const canAttack = battle.legalActions.some((action) => action.type === "attack");
  const canAttach = battle.legalActions.some((action) => action.type === "attach_energy");
  const waiting = battle.status === "active" && battle.legalActions.length === 0 && battle.phase !== "setup";

  return (
    <div
      data-slot="battle-board"
      className="relative mx-auto min-h-[42rem] w-full max-w-lg overflow-hidden rounded-[2rem] bg-secondary shadow-inner"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,color-mix(in_oklab,var(--energy-water)_35%,transparent)_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full border-8 border-white/30" />
      <div className="relative flex min-h-[42rem] flex-col justify-between px-3 py-4">
        <div className="flex flex-col items-center gap-3">
          <BattleScore name={battle.opponent.name} points={battle.cpu.points} align="right" />
          <div className="flex min-h-24 items-start justify-center gap-2">
            {battle.cpu.bench.map((pokemon) => (
              <BattlePokemonSlot key={pokemon.uid} pokemon={pokemon} faint={pokemon.remainingHp <= 0} />
            ))}
          </div>
          {battle.cpu.active ? (
            <div className="relative">
              <BattlePokemonSlot pokemon={battle.cpu.active} active />
              {damage && damage.uid === battle.cpu.active.uid ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg font-black text-destructive">
                  -{damage.amount}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-foreground-subtle">Aguardando Pokémon</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          {battle.player.active ? (
            <div className="relative">
              <BattlePokemonSlot
                pokemon={battle.player.active}
                active
                selected={selectedPokemon === battle.player.active.uid}
                onClick={() => board.selectPokemon(battle.player.active!.uid)}
              />
              {damage && damage.uid === battle.player.active.uid ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg font-black text-destructive">
                  -{damage.amount}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-foreground-subtle">Escolha um Pokémon Ativo</p>
          )}
          <div className="flex min-h-24 items-end justify-center gap-2">
            {battle.player.bench.map((pokemon) => (
              <BattlePokemonSlot
                key={pokemon.uid}
                pokemon={pokemon}
                selected={selectedPokemon === pokemon.uid}
                onClick={() => board.selectPokemon(pokemon.uid)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-24 left-3">
        <BattleScore name="Você" points={battle.player.points} align="left" />
      </div>
      <div className="absolute bottom-24 right-3">
        <BattleEnergyZone
          energy={battle.player.currentEnergy}
          selected={board.selection.kind === "energy"}
          onSelect={
            canAttach
              ? () => board.setSelection(board.selection.kind === "energy" ? { kind: "none" } : { kind: "energy" })
              : undefined
          }
        />
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <Button size="sm" disabled={!canEnd || board.pending} onClick={() => board.play({ type: "end_turn" })}>
          Encerrar turno
        </Button>
      </div>
      <div className="absolute bottom-4 left-3 z-10">
        <BattleForfeitButton onForfeit={board.forfeit} pending={board.pending} />
      </div>
      {battle.player.hand ? (
        <div className="absolute inset-x-0 bottom-2">
          <BattleHand
            cards={battle.player.hand}
            selectedUid={board.selection.kind === "hand" ? board.selection.uid : undefined}
            onSelect={board.selectHand}
          />
        </div>
      ) : null}
      {waiting ? (
        <p className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 rounded-full bg-white/80 px-4 py-1 text-sm font-semibold">
          Turno do oponente
        </p>
      ) : null}
      {activeSelected && battle.player.active && battle.phase === "main" ? (
        <BattleActionSheet
          pokemon={battle.player.active}
          canAttack={canAttack}
          canRetreat={canRetreat}
          onAttack={(attackIndex) => board.play({ type: "attack", attackIndex })}
          onRetreat={() => {
            const retreat = battle.legalActions.find((action) => action.type === "retreat");
            if (retreat && retreat.type === "retreat") board.play(retreat);
          }}
          onClose={() => board.setSelection({ kind: "none" })}
        />
      ) : null}
      {battle.phase === "setup" && !battle.player.active ? (
        <BattleSetup
          battle={battle}
          pending={board.pending}
          onConfirm={(activeUid, benchUids) => board.play({ type: "setup", activeUid, benchUids })}
        />
      ) : null}
      {battle.status !== "active" ? <BattleResultDialog battle={battle} /> : null}
      {board.error ? (
        <p className={cn("absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-sm text-destructive")}>
          {board.error.message}
        </p>
      ) : null}
    </div>
  );
}

export { BattleBoard };
