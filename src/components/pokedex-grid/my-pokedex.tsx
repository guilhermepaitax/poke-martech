"use client";

import { PokedexGrid } from "@/components/pokedex-grid/pokedex-grid";
import { screenColumnClass } from "@/components/ui/empty-state";
import { CardGridSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { usePokedex } from "@/hooks/use-pokedex";
import { cn } from "@/lib/utils";

function MyPokedex() {
  const pokedex = usePokedex();
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
  const empty = pokedex.data.length === 0;
  return (
    <div data-slot="my-pokedex" className={cn("flex flex-col gap-6", empty && screenColumnClass)}>
      <h1 className="text-3xl font-semibold">Pokédex</h1>
      <PokedexGrid entries={pokedex.data} emptyPlacement={empty ? "fill" : "section"} />
    </div>
  );
}

export { MyPokedex };
