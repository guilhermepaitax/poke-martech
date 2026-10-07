"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CardGenerationLinksProps {
  links: string[];
  canAdd: boolean;
  isInvalid: (value: string) => boolean;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function CardGenerationLinks({ links, canAdd, isInvalid, onChange, onAdd, onRemove }: CardGenerationLinksProps) {
  return (
    <div data-slot="card-generation-links" className="flex flex-col gap-2">
      {links.map((link, index) => {
        const invalid = isInvalid(link);
        return (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Input
                type="url"
                inputMode="url"
                aria-label={`Link do Pokémon ${index + 1}`}
                aria-invalid={invalid || undefined}
                placeholder="https://www.pokemon-zone.com/cards/a1/143/machop/"
                value={link}
                onChange={(event) => onChange(index, event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Remover link ${index + 1}`}
                onClick={() => onRemove(index)}
                disabled={links.length === 1 && !link}
              >
                <X className="size-4" />
              </Button>
            </div>
            {invalid ? (
              <p className="text-sm text-destructive">Use um link de carta do pokemon-zone.com.</p>
            ) : null}
          </div>
        );
      })}
      {canAdd ? (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onAdd}>
          <Plus className="size-4" />
          Adicionar link
        </Button>
      ) : null}
    </div>
  );
}

export { CardGenerationLinks };
