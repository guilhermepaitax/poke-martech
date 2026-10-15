const MAX_CARD_TAGS = 12;
const MAX_CARD_TAG_LENGTH = 32;

function foldText(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function normalizeCardTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCardTags(values: string[]) {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const value of values) {
    const tag = normalizeCardTag(value);
    if (!tag || tag.length > MAX_CARD_TAG_LENGTH || tag.includes(",")) continue;
    const key = foldText(tag);
    if (seen.has(key)) continue;
    if (tags.length >= MAX_CARD_TAGS) break;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

function cardHasTag(tags: string[], tag: string) {
  const key = foldText(tag);
  return tags.some((item) => foldText(item) === key);
}

function cardMatchesTags(tags: string[], selected: string[]) {
  if (selected.length === 0) return true;
  return selected.some((tag) => cardHasTag(tags, tag));
}

export {
  MAX_CARD_TAG_LENGTH,
  MAX_CARD_TAGS,
  cardHasTag,
  cardMatchesTags,
  foldText,
  normalizeCardTag,
  normalizeCardTags,
};
