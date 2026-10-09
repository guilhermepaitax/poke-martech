"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EnergyChip } from "@/components/ui/energy-chip";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useInfiniteSlice } from "@/hooks/use-infinite-slice";
import { useListLocation } from "@/hooks/use-list-location";
import { formatCardNumber } from "@/lib/card-number";
import { withReturnTo } from "@/lib/return-path";
import { cn } from "@/lib/utils";
import type { PokedexEntry } from "@/types/catalog";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { UndiscoveredCard } from "./undiscovered-card";
import { usePokedexFilters } from "./use-pokedex-filters";

type GridEntry = PokedexEntry & { viewerOwns?: boolean };

function PokedexGrid({
  entries,
  ownedOnly = false,
  markMissing = false,
  emptyPlacement = "section",
  onPropose,
}: {
  entries: GridEntry[];
  ownedOnly?: boolean;
  markMissing?: boolean;
  emptyPlacement?: "fill" | "section";
  onPropose?: (entry: GridEntry) => void;
}) {
  const listed = ownedOnly
    ? entries.filter((entry) => entry.ownedCount > 0)
    : entries;
  const ownership = new Map(
    entries.map((entry) => [entry.id, entry.viewerOwns]),
  );
  const filters = usePokedexFilters(listed);
  const here = useListLocation();
  const {
    visible: shown,
    hasMore,
    sentinelRef,
  } = useInfiniteSlice(filters.visible);
  const progress =
    filters.total === 0 ? 0 : (filters.owned / filters.total) * 100;

  if (listed.length === 0) {
    return (
      <EmptyState
        placement={emptyPlacement}
        icon={BookOpen}
        title={
          ownedOnly ? "Nenhuma carta na coleção" : "Nenhuma carta publicada"
        }
        description={
          ownedOnly
            ? "As cartas que este treinador já obteve aparecem nesta grade."
            : "Quando uma carta for publicada no catálogo, ela entra na Pokédex."
        }
      />
    );
  }

  return (
    <div data-slot="pokedex-grid" className="flex flex-col gap-5">
      {ownedOnly ? (
        <p className="text-sm text-foreground-subtle">
          {filters.total} {filters.total === 1 ? "carta" : "cartas"}
        </p>
      ) : (
        <div>
          <p className="text-sm text-foreground-subtle">
            {filters.owned} de {filters.total} cartas
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <Input
          aria-label="Buscar carta"
          placeholder="Buscar carta obtida"
          value={filters.query}
          onChange={(event) => filters.setQuery(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-selected={filters.type === "all" ? "" : undefined}
            onClick={() => filters.setType("all")}
            className="rounded-full bg-white/50 px-3 py-1.5 text-sm font-medium text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-selected:bg-primary data-selected:text-primary-foreground"
          >
            Todos
          </button>
          {filters.types.map((energy) => (
            <EnergyChip
              key={energy.code}
              energy={energy.code}
              selected={filters.type === energy.code}
              onClick={() => filters.setType(energy.code)}
            />
          ))}
        </div>
        <SegmentedControl
          ariaLabel="Ordenar"
          value={filters.sort}
          onValueChange={(sort) => filters.setSort(sort as typeof filters.sort)}
          options={[
            { value: "number", label: "Número" },
            { value: "name", label: "Nome" },
            { value: "hp", label: "HP" },
            { value: "rarity", label: "Raridade" },
          ]}
        />
      </div>
      {filters.visible.length === 0 ? (
        <EmptyState
          placement="section"
          icon={Search}
          title="Nenhuma carta com esse filtro"
          description="Tente outro nome, tipo ou ordem. A coleção continua inteira por baixo da busca."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((entry) => {
            const missing = markMissing && ownership.get(entry.id) === false;
            return (
              <li key={entry.id} className="flex flex-col gap-2">
                {entry.card ? (
                  <>
                    <Link
                      href={withReturnTo(`/pokedex/${entry.id}`, here)}
                      className="flex flex-col gap-2 rounded-[4%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className={cn(missing && "opacity-20 grayscale")}>
                        <HoloCard {...entry.card} />
                      </div>
                      <p className="text-center text-sm font-semibold tabular-nums text-foreground-subtle">
                        {formatCardNumber(entry.number)}
                      </p>
                      <p className="text-center text-sm text-foreground-subtle">
                        {entry.ownedCount}{" "}
                        {entry.ownedCount === 1 ? "cópia" : "cópias"}
                      </p>
                    </Link>
                    {missing ? (
                      <p className="text-center text-sm text-foreground-subtle">
                        Você não tem
                      </p>
                    ) : null}
                    {onPropose ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPropose(entry)}
                      >
                        Propor troca
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <UndiscoveredCard number={entry.number} />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {hasMore ? (
        <p
          ref={sentinelRef}
          data-slot="pokedex-scroll-sentinel"
          className="text-center text-sm text-foreground-subtle"
        >
          Role para ver mais
        </p>
      ) : null}
    </div>
  );
}

export { PokedexGrid };
