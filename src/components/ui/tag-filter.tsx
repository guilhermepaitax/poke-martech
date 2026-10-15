"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { cardHasTag, foldText } from "@/lib/value-objects/card-tag";
import { useState } from "react";

interface TagFilterProps {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  ariaLabel: string;
  className?: string;
}

function TagFilter({
  tags,
  selected,
  onToggle,
  ariaLabel,
  className,
}: TagFilterProps) {
  const [query, setQuery] = useState("");
  const folded = foldText(query);
  const visible = folded
    ? tags.filter((tag) => foldText(tag).includes(folded))
    : tags;

  return (
    <div
      data-slot="tag-filter"
      className={cn("flex flex-col gap-2", className)}
    >
      {tags.length > 8 ? (
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filtrar tags"
          aria-label={`Filtrar ${ariaLabel.toLowerCase()}`}
          autoComplete="off"
        />
      ) : null}
      <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
        {visible.map((tag) => {
          const active = cardHasTag(selected, tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              data-selected={active ? "" : undefined}
              onClick={() => onToggle(tag)}
              className="rounded-full cursor-pointer bg-white/50 px-3 py-1.5 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-selected:bg-primary data-selected:text-primary-foreground"
            >
              {tag}
            </button>
          );
        })}
        {visible.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            Nenhuma tag com esse nome.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export { TagFilter };
