"use client";

import { Label } from "@/components/ui/input";
import { foldText } from "@/lib/value-objects/card-tag";
import { Combobox } from "@base-ui/react/combobox";
import { ChevronDown, X } from "lucide-react";
import { useCardTagField, type TagChoice } from "./use-card-tag-field";

interface CardTagFieldProps {
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}

function CardTagField({ tags, suggestions, onChange }: CardTagFieldProps) {
  const field = useCardTagField(tags, suggestions, onChange);

  return (
    <div data-slot="card-tag-field" className="flex flex-col gap-2">
      <Label htmlFor="card-tags">Tags</Label>
      <Combobox.Root<TagChoice, true>
        items={field.items}
        multiple
        autoHighlight
        value={field.selected}
        inputValue={field.query}
        onInputValueChange={field.onInputValueChange}
        onValueChange={field.onValueChange}
        onItemHighlighted={field.setHighlighted}
        filter={field.filterItem}
        isItemEqualToValue={(item, selected) =>
          !item.creatable &&
          !selected.creatable &&
          foldText(item.id) === foldText(selected.id)
        }
        itemToStringLabel={(item) => item.name}
      >
        <Combobox.InputGroup className="flex min-h-11 items-center gap-1 rounded-2xl border border-gray-200 bg-white/50 px-2 py-1.5 backdrop-blur-md focus-within:ring-2 focus-within:ring-ring">
          <Combobox.Value>
            {(value: TagChoice[]) => (
              <Combobox.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {value.map((tag) => (
                  <Combobox.Chip
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-sm font-medium text-foreground"
                    aria-label={tag.name}
                  >
                    {tag.name}
                    <Combobox.ChipRemove
                      aria-label={`Remover tag ${tag.name}`}
                      className="rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3.5" />
                    </Combobox.ChipRemove>
                  </Combobox.Chip>
                ))}
                <Combobox.Input
                  id="card-tags"
                  placeholder={value.length ? "" : "Escolher ou criar tag"}
                  autoComplete="off"
                  aria-invalid={field.error ? true : undefined}
                  aria-describedby="card-tags-hint"
                  onKeyDown={field.onKeyDown}
                  className="h-8 min-w-32 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </Combobox.Chips>
            )}
          </Combobox.Value>
          <Combobox.Trigger
            aria-label="Mostrar tags"
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
                {(item: TagChoice) => (
                  <Combobox.Item
                    key={item.id}
                    value={item}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-muted"
                  >
                    {item.name}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <p id="card-tags-hint" className="text-sm text-foreground-subtle">
        Opcional. Escolha uma tag existente ou crie uma nova.
      </p>
      {field.error ? (
        <p className="text-sm text-destructive">{field.error}</p>
      ) : null}
    </div>
  );
}

export { CardTagField };
