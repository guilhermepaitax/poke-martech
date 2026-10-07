"use client";

import Link from "next/link";
import { HoloCard } from "@/components/holo-card/holo-card";
import { EnergyChip } from "@/components/ui/energy-chip";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatCardNumber } from "@/lib/card-number";
import type { PokedexEntry } from "@/types/catalog";
import { UndiscoveredCard } from "./undiscovered-card";
import { usePokedexFilters } from "./use-pokedex-filters";

function PokedexGrid({
  entries,
  ownedOnly = false,
}: {
  entries: PokedexEntry[];
  ownedOnly?: boolean;
}) {
  const listed = ownedOnly ? entries.filter((entry) => entry.ownedCount > 0) : entries;
  const filters = usePokedexFilters(listed);
  const progress = filters.total === 0 ? 0 : (filters.owned / filters.total) * 100;

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
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
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
      {listed.length === 0 ? (
        <p className="text-foreground-subtle">
          {ownedOnly ? "Nenhuma carta obtida." : "Nenhuma carta publicada."}
        </p>
      ) : filters.visible.length === 0 ? (
        <p className="text-foreground-subtle">Nenhuma carta com esse filtro.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filters.visible.map((entry) => (
            <li key={entry.id}>
              {entry.card ? (
                <Link
                  href={`/pokedex/${entry.id}`}
                  className="flex h-full flex-col gap-2 rounded-[4%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HoloCard {...entry.card} />
                  <p className="text-center text-sm font-semibold tabular-nums text-foreground-subtle">
                    {formatCardNumber(entry.number)}
                  </p>
                  <p className="text-center text-sm text-foreground-subtle">
                    {entry.ownedCount} {entry.ownedCount === 1 ? "cópia" : "cópias"}
                  </p>
                </Link>
              ) : (
                <UndiscoveredCard number={entry.number} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { PokedexGrid };
