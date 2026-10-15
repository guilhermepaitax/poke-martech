import type { KeyboardEvent } from "react";
import { useState } from "react";
import {
  MAX_CARD_TAG_LENGTH,
  MAX_CARD_TAGS,
  cardHasTag,
  foldText,
  normalizeCardTag,
  normalizeCardTags,
} from "@/lib/value-objects/card-tag";

function useCardTagField(tags: string[], suggestions: string[], onChange: (tags: string[]) => void) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const query = foldText(draft);
  const matches = suggestions
    .filter((tag) => !cardHasTag(tags, tag))
    .filter((tag) => (query ? foldText(tag).includes(query) : false))
    .slice(0, 8);

  function add(value: string) {
    const tag = normalizeCardTag(value);
    if (!tag) {
      setDraft("");
      setError(null);
      return;
    }
    if (tag.includes(",")) {
      setError("A tag não pode ter vírgula.");
      return;
    }
    if (tag.length > MAX_CARD_TAG_LENGTH) {
      setError("A tag pode ter no máximo 32 caracteres.");
      return;
    }
    if (tags.length >= MAX_CARD_TAGS && !cardHasTag(tags, tag)) {
      setError("Uma carta pode ter no máximo 12 tags.");
      return;
    }
    setError(null);
    setDraft("");
    onChange(normalizeCardTags([...tags, tag]));
  }

  function remove(tag: string) {
    setError(null);
    onChange(tags.filter((item) => foldText(item) !== foldText(tag)));
  }

  function onDraftChange(value: string) {
    if (!value.includes(",")) {
      setDraft(value);
      setError(null);
      return;
    }
    const [first, ...rest] = value.split(",");
    add(first);
    const pending = rest.join(",").trim();
    if (pending) setDraft(pending);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      add(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  }

  return { draft, error, matches, add, remove, onDraftChange, onKeyDown };
}

export { useCardTagField };
