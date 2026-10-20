"use client";

import { CardZoomDialog } from "@/components/holo-card/card-zoom-dialog";
import { HoloCard } from "@/components/holo-card/holo-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EnergyChip } from "@/components/ui/energy-chip";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useLoadMore } from "@/hooks/use-load-more";
import { useListLocation } from "@/hooks/use-list-location";
import { withReturnTo } from "@/lib/return-path";
import type { CardFace, PokedexEntry } from "@/types/catalog";
import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { PokedexCardTile } from "./pokedex-card-tile";
import { UndiscoveredCard } from "./undiscovered-card";
import type { PokedexFiltersState } from "./use-pokedex-filters";

type GridEntry = PokedexEntry & { viewerOwns?: boolean };

function PokedexGrid({
  filters,
  entries,
  owned,
  total,
  hasMore,
  isFetchingMore,
  onLoadMore,
  ownedOnly = false,
  markMissing = false,
  emptyPlacement = "section",
  onPropose,
}: {
  filters: PokedexFiltersState;
  entries: GridEntry[];
  owned: number;
  total: number;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  ownedOnly?: boolean;
  markMissing?: boolean;
  emptyPlacement?: "fill" | "section";
  onPropose?: (entry: GridEntry) => void;
}) {
  const here = useListLocation();
  const [zoomed, setZoomed] = useState<CardFace | null>(null);
  const sentinelRef = useLoadMore(hasMore && !isFetchingMore, onLoadMore);
  const progress = total === 0 ? 0 : (owned / total) * 100;

  if (total === 0) {
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
          {total} {total === 1 ? "carta" : "cartas"}
        </p>
      ) : (
        <div>
          <p className="text-sm text-foreground-subtle">
            {owned} de {total} cartas
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
        <span className="text-sm text-foreground-subtle font-semibold">
          Tipos
        </span>
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
        <span className="text-sm text-foreground-subtle font-semibold">
          Ordenar por
        </span>
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
      {entries.length === 0 ? (
        <EmptyState
          placement="section"
          icon={Search}
          title="Nenhuma carta com esse filtro"
          description="Tente outro nome, tipo ou ordem. A coleção continua inteira por baixo da busca."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {entries.map((entry) => {
            const missing = markMissing && entry.viewerOwns === false;
            return (
              <li key={entry.id} className="flex flex-col gap-2">
                {entry.card ? (
                  <>
                    <PokedexCardTile
                      href={withReturnTo(`/pokedex/${entry.id}`, here)}
                      card={entry.card}
                      number={entry.number}
                      ownedCount={entry.ownedCount}
                      missing={missing}
                      onZoom={() => setZoomed(entry.card)}
                    />
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
          {isFetchingMore ? "Carregando mais cartas" : "Role para ver mais"}
        </p>
      ) : null}
      <CardZoomDialog
        open={zoomed !== null}
        onOpenChange={(open) => {
          if (!open) setZoomed(null);
        }}
        title={zoomed?.name}
      >
        {zoomed ? <HoloCard {...zoomed} effects /> : null}
      </CardZoomDialog>
    </div>
  );
}

export { PokedexGrid };
