"use client";

import { Combobox } from "@base-ui/react/combobox";
import { ChevronDown, LoaderCircle, X } from "lucide-react";
import type { CardOption } from "@/types/catalog";
import { useCardEvolutionField } from "./use-card-evolution-field";

interface CardEvolutionFieldProps {
  value: CardOption | null;
  excludeId: string | null;
  onChange: (card: CardOption | null) => void;
}

function CardEvolutionField({ value, excludeId, onChange }: CardEvolutionFieldProps) {
  const field = useCardEvolutionField(value, excludeId);

  return (
    <div data-slot="card-evolution-field" className="flex flex-col gap-2">
      <label htmlFor="card-evolves-from" className="text-sm font-medium text-foreground-subtle">
        Evolui de
      </label>
      <Combobox.Root<CardOption>
        items={field.items}
        filter={null}
        value={value}
        onValueChange={(next) => onChange(next ?? null)}
        onInputValueChange={field.setQuery}
        onOpenChange={field.setOpen}
        itemToStringLabel={(card) => card.name}
        isItemEqualToValue={(card, selected) => card.id === selected.id}
      >
        <Combobox.InputGroup className="glass flex h-11 items-center gap-1 rounded-2xl pl-3 pr-1 focus-within:ring-2 focus-within:ring-ring">
          <Combobox.Input
            id="card-evolves-from"
            placeholder="Buscar carta pelo nome"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {field.isSearching ? (
            <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin text-foreground-subtle" />
          ) : null}
          {value ? (
            <Combobox.Clear
              aria-label="Remover carta de origem"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </Combobox.Clear>
          ) : null}
          <Combobox.Trigger
            aria-label="Mostrar cartas"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Combobox.Icon>
              <ChevronDown className="size-4" />
            </Combobox.Icon>
          </Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Portal>
          <Combobox.Positioner className="z-50" sideOffset={6}>
            <Combobox.Popup className="glass bg-white/80! max-h-72 w-[var(--anchor-width)] overflow-auto rounded-xl p-2">
              <Combobox.Empty className="px-3 py-2 text-sm text-foreground-subtle">
                {field.emptyMessage}
              </Combobox.Empty>
              <Combobox.List>
                {(card: CardOption) => (
                  <Combobox.Item
                    key={card.id}
                    value={card}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-muted"
                  >
                    {card.name}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}

export { CardEvolutionField };
