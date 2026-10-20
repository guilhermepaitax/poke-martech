import { useAdminCardSearch } from "@/hooks/use-admin";
import type { CardOption } from "@/types/catalog";
import { useEffect, useState } from "react";

const SEARCH_DELAY_MS = 250;

function useCardEvolutionField(selected: CardOption | null, excludeId: string | null) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const search = useAdminCardSearch(term, excludeId, open);

  useEffect(() => {
    const next = query === selected?.name ? "" : query.trim();
    const timer = setTimeout(() => setTerm(next), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, selected?.name]);

  const results = search.data ?? [];
  const items =
    selected && !results.some((card) => card.id === selected.id)
      ? [selected, ...results]
      : results;
  const emptyMessage = search.isFetching
    ? "Buscando cartas..."
    : term
      ? "Nenhuma carta com esse nome."
      : "Nenhuma carta cadastrada.";

  return {
    items,
    emptyMessage,
    isSearching: search.isFetching,
    setOpen,
    setQuery,
  };
}

export { useCardEvolutionField };
