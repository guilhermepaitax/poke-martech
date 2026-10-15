"use client";

import { X } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { useCardTagField } from "./use-card-tag-field";

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
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-sm font-medium text-foreground"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remover tag ${tag}`}
                onClick={() => field.remove(tag)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Input
        id="card-tags"
        value={field.draft}
        onChange={(event) => field.onDraftChange(event.target.value)}
        onKeyDown={field.onKeyDown}
        placeholder="Adicionar tag"
        autoComplete="off"
        aria-invalid={field.error ? true : undefined}
        aria-describedby="card-tags-hint"
      />
      <p id="card-tags-hint" className="text-sm text-foreground-subtle">
        Opcional. Enter confirma a tag para a busca e os pacotes.
      </p>
      {field.error ? <p className="text-sm text-destructive">{field.error}</p> : null}
      {field.matches.length ? (
        <div className="flex flex-wrap gap-2">
          {field.matches.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => field.add(tag)}
              className="rounded-full bg-white/50 px-3 py-1.5 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { CardTagField };
