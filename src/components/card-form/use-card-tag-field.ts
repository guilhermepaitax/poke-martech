import {
  cardHasTag,
  foldText,
  MAX_CARD_TAG_LENGTH,
  MAX_CARD_TAGS,
  normalizeCardTag,
  normalizeCardTags,
} from "@/lib/value-objects/card-tag";
import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";

type TagChoice = {
  id: string;
  name: string;
  creatable?: string;
};

function cardTagChoices(tags: string[], suggestions: string[], query: string) {
  const normalized = normalizeCardTag(query);
  const available = suggestions.filter((tag) => !cardHasTag(tags, tag));
  const exactExists =
    cardHasTag(tags, normalized) ||
    available.some((tag) => foldText(tag) === foldText(normalized));
  const canCreate =
    normalized.length > 0 &&
    !exactExists &&
    !normalized.includes(",") &&
    normalized.length <= MAX_CARD_TAG_LENGTH &&
    tags.length < MAX_CARD_TAGS;
  const items: TagChoice[] = available.map((tag) => ({ id: tag, name: tag }));
  if (canCreate) {
    items.push({
      id: `create:${foldText(normalized)}`,
      name: `Criar "${normalized}"`,
      creatable: normalized,
    });
  }
  const emptyMessage = cardHasTag(tags, normalized)
    ? "Essa tag já está na carta."
    : normalized
      ? "Nenhuma tag com esse nome."
      : suggestions.length > 0
        ? "Todas as tags já estão na carta."
        : "Nenhuma tag cadastrada ainda.";
  return { items, emptyMessage };
}

function matchesCardTagChoice(item: TagChoice, query: string) {
  if (item.creatable) return true;
  const folded = foldText(query);
  if (!folded) return true;
  return foldText(item.name).includes(folded);
}

function useCardTagField(
  tags: string[],
  suggestions: string[],
  onChange: (tags: string[]) => void,
) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const highlighted = useRef<TagChoice | undefined>(undefined);
  const { items, emptyMessage } = cardTagChoices(tags, suggestions, query);
  const selected: TagChoice[] = tags.map((tag) => ({ id: tag, name: tag }));

  function add(value: string) {
    const tag = normalizeCardTag(value);
    if (!tag) return false;
    if (tag.includes(",")) {
      setError("A tag não pode ter vírgula.");
      return false;
    }
    if (tag.length > MAX_CARD_TAG_LENGTH) {
      setError("A tag pode ter no máximo 32 caracteres.");
      return false;
    }
    if (cardHasTag(tags, tag)) {
      setError("Essa tag já está na carta.");
      return false;
    }
    if (tags.length >= MAX_CARD_TAGS) {
      setError("Uma carta pode ter no máximo 12 tags.");
      return false;
    }
    const existing = suggestions.find(
      (item) => foldText(item) === foldText(tag),
    );
    setError(null);
    onChange(normalizeCardTags([...tags, existing ?? tag]));
    return true;
  }

  function onValueChange(next: TagChoice[], details: { cancel: () => void }) {
    const created = next.find((item) => item.creatable);
    if (created?.creatable) {
      details.cancel();
      if (add(created.creatable)) setQuery("");
      return;
    }
    setError(null);
    setQuery("");
    onChange(
      normalizeCardTags(
        next.filter((item) => !item.creatable).map((item) => item.name),
      ),
    );
  }

  function onInputValueChange(value: string) {
    if (!value.includes(",")) {
      setQuery(value);
      setError(null);
      return;
    }
    const [first, ...rest] = value.split(",");
    const added = add(first ?? "");
    setQuery(added ? rest.join(",") : (first ?? ""));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (highlighted.current) return;
    if (add(query)) setQuery("");
  }

  function setHighlighted(item: TagChoice | undefined) {
    highlighted.current = item;
  }

  function filterItem(item: TagChoice, currentQuery: string) {
    return matchesCardTagChoice(item, currentQuery);
  }

  return {
    query,
    error,
    items,
    selected,
    emptyMessage,
    onValueChange,
    onInputValueChange,
    onKeyDown,
    setHighlighted,
    filterItem,
  };
}

export { cardTagChoices, matchesCardTagChoice, useCardTagField };
export type { TagChoice };
