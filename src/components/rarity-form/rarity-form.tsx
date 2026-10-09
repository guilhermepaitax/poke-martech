"use client";

import { useState } from "react";
import { RARITY_LABELS, type Rarity } from "@/lib/value-objects/card";
import { useRarities, useSaveRarities } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { Stepper } from "@/components/ui/stepper";
import type { RarityWeight } from "@/types/catalog";

function RarityForm() {
  const rarities = useRarities();
  const save = useSaveRarities();
  const [draft, setDraft] = useState<RarityWeight[] | null>(null);
  const form = draft ?? rarities.data ?? [];

  if (rarities.isLoading) {
    return (
      <LoadingScreen label="Carregando raridades" className="glass flex max-w-xl flex-col gap-5 rounded-3xl p-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        ))}
      </LoadingScreen>
    );
  }
  if (rarities.isError) return <p className="text-destructive">Não foi possível carregar os pesos.</p>;

  return (
    <form
      data-slot="rarity-form"
      className="glass flex max-w-xl flex-col gap-5 rounded-3xl p-5"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(form, { onSuccess: () => setDraft(null) });
      }}
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Pesos de raridade</h1>
        <p className="mt-2 text-sm text-foreground-subtle">Quanto maior o peso, mais fácil a carta sai no pacote.</p>
      </div>
      {form.map((item) => (
        <div key={item.rarity} className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium">{RARITY_LABELS[item.rarity as Rarity]}</p>
          <Stepper
            ariaLabel={RARITY_LABELS[item.rarity as Rarity]}
            value={item.weight}
            min={1}
            max={100}
            onValueChange={(weight) => {
              setDraft(form.map((row) => (row.rarity === item.rarity ? { ...row, weight } : row)));
            }}
          />
        </div>
      ))}
      {save.isError ? <p className="text-sm text-destructive">{save.error.message}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending || draft === null}>Salvar</Button>
        <Button variant="outline" onClick={() => setDraft(null)} disabled={draft === null || save.isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export { RarityForm };
