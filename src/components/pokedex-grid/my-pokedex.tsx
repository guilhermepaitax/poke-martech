"use client";

import { PokedexGrid } from "@/components/pokedex-grid/pokedex-grid";
import { usePokedexFilters } from "@/components/pokedex-grid/use-pokedex-filters";
import { screenColumnClass } from "@/components/ui/empty-state";
import { CardGridSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { useMyPokedexPages } from "@/hooks/use-pokedex";
import { cn } from "@/lib/utils";

function MyPokedex() {
  const filters = usePokedexFilters();
  const pokedex = useMyPokedexPages(filters.applied);
  if (pokedex.isLoading) {
    return (
      <LoadingScreen label="Carregando Pokédex" className="flex flex-col gap-6">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-10 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <CardGridSkeleton />
      </LoadingScreen>
    );
  }
  if (pokedex.isError || !pokedex.data) {
    return <p className="text-destructive">Não foi possível carregar a Pokédex.</p>;
  }
  const first = pokedex.data.pages[0];
  const empty = !first || first.total === 0;
  return (
    <div data-slot="my-pokedex" className={cn("flex flex-col gap-6", empty && screenColumnClass)}>
      <h1 className="text-3xl font-semibold">Pokédex</h1>
      <PokedexGrid
        filters={filters}
        entries={pokedex.data.pages.flatMap((page) => page.items)}
        owned={first?.owned ?? 0}
        total={first?.total ?? 0}
        hasMore={pokedex.hasNextPage}
        isFetchingMore={pokedex.isFetchingNextPage}
        onLoadMore={() => void pokedex.fetchNextPage()}
        emptyPlacement={empty ? "fill" : "section"}
      />
    </div>
  );
}

export { MyPokedex };
