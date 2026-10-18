"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import type { ArenaRosterEntry } from "@/lib/arena/fighter";
import type { ArenaSide } from "@/lib/arena/selection";
import { Search } from "lucide-react";

import { ArenaPickerCard } from "./arena-picker-card";
import { ArenaPickerSlot } from "./arena-picker-slot";

function ArenaPicker({
  entries,
  player,
  opponent,
  active,
  query,
  onQuery,
  page,
  pageCount,
  onPageChange,
  onChoose,
  onActivate,
  onFight,
  canFight,
}: {
  entries: ArenaRosterEntry[];
  player: ArenaRosterEntry | null;
  opponent: ArenaRosterEntry | null;
  active: ArenaSide;
  query: string;
  onQuery: (value: string) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onChoose: (id: string) => void;
  onActivate: (side: ArenaSide) => void;
  onFight: () => void;
  canFight: boolean;
}) {
  const sideOf = (id: string): ArenaSide | null => {
    if (id === player?.id) return "player";
    if (id === opponent?.id) return "opponent";
    return null;
  };

  return (
    <div data-slot="arena-picker" className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground">
          Escolha quem entra na arena
        </h1>
        <Button onClick={onFight} disabled={!canFight} className="sm:shrink-0">
          Lutar
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-10">
        <ArenaPickerSlot
          label="Você"
          entry={player}
          active={active === "player"}
          onActivate={() => onActivate("player")}
        />
        <ArenaPickerSlot
          label="Oponente"
          entry={opponent}
          active={active === "opponent"}
          onActivate={() => onActivate("opponent")}
        />
      </div>
      <Input
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Buscar lutador"
        aria-label="Buscar lutador"
      />
      {entries.length === 0 ? (
        <EmptyState
          placement="section"
          icon={Search}
          title="Nenhum lutador com esse nome"
          description="Apague a busca para ver o catálogo de novo."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {entries.map((entry) => (
            <li key={entry.id}>
              <ArenaPickerCard
                entry={entry}
                side={sideOf(entry.id)}
                onChoose={onChoose}
              />
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </div>
  );
}

export { ArenaPicker };
