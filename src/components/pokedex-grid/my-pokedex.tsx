"use client";

import { usePokedex } from "@/hooks/use-pokedex";
import { PokedexGrid } from "@/components/pokedex-grid/pokedex-grid";

function MyPokedex() {
  const pokedex = usePokedex();
  if (pokedex.isLoading) return <p className="text-foreground-subtle">Carregando Pokédex...</p>;
  if (pokedex.isError || !pokedex.data) {
    return <p className="text-destructive">Não foi possível carregar a Pokédex.</p>;
  }
  return (
    <div data-slot="my-pokedex" className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Pokédex</h1>
      <PokedexGrid entries={pokedex.data} />
    </div>
  );
}

export { MyPokedex };
