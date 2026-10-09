"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { pokemonTypeName, usePokemonTypes } from "@/hooks/use-pokemon-types";
import { useAdminCards } from "@/hooks/use-admin";
import { paginate } from "@/lib/paginate";
import { RARITIES, RARITY_LABELS } from "@/lib/value-objects/card";
import {
  adminCardFiltersFromSearch,
  adminCardListHref,
  filterAdminCards,
  formatAdminCardCount,
  hasActiveAdminCardFilters,
  isCardListStatus,
  parseEnergyTypeFilter,
  parseRarityFilter,
} from "./filter-admin-cards";

function useAdminCardList() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cards = useAdminCards();
  const types = usePokemonTypes();
  const search = searchParams.toString();
  const { filters, page } = useMemo(
    () => adminCardFiltersFromSearch(new URLSearchParams(search)),
    [search],
  );
  const [draftName, setDraftName] = useState<string | null>(null);
  if (draftName !== null && draftName === filters.name) setDraftName(null);
  const name = draftName ?? filters.name;
  const catalog = useMemo(() => cards.data ?? [], [cards.data]);
  const filtered = useMemo(
    () => filterAdminCards(catalog, { ...filters, name }),
    [catalog, filters, name],
  );
  const paged = useMemo(() => paginate(filtered, page), [filtered, page]);
  const typeOptions = useMemo(
    () => [
      { value: "all", label: "Todos os tipos" },
      ...catalog
        .map((card) => card.energyType)
        .filter((type, index, all) => all.indexOf(type) === index)
        .map((type) => ({ value: type, label: pokemonTypeName(types.data, type) }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    ],
    [catalog, types.data],
  );
  const rarityOptions = useMemo(
    () => [
      { value: "all", label: "Todas as raridades" },
      ...RARITIES.filter((rarity) => catalog.some((card) => card.rarity === rarity)).map(
        (rarity) => ({ value: rarity, label: RARITY_LABELS[rarity] }),
      ),
    ],
    [catalog],
  );

  function commit(nextFilters: typeof filters, nextPage: number) {
    router.replace(adminCardListHref(pathname, searchParams, nextFilters, nextPage), { scroll: false });
  }

  function setName(value: string) {
    setDraftName(value);
    commit({ ...filters, name: value }, 1);
  }

  function setStatus(value: string) {
    if (!isCardListStatus(value)) return;
    commit({ ...filters, name, status: value }, 1);
  }

  function setEnergyType(value: string) {
    const energyType = parseEnergyTypeFilter(value);
    if (!energyType) return;
    commit({ ...filters, name, energyType }, 1);
  }

  function setRarity(value: string) {
    const rarity = parseRarityFilter(value);
    if (!rarity) return;
    commit({ ...filters, name, rarity }, 1);
  }

  function clearFilters() {
    setDraftName("");
    commit({ name: "", status: "all", energyType: "all", rarity: "all" }, 1);
  }

  function setPage(nextPage: number) {
    commit({ ...filters, name }, nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    cards,
    types,
    filters: { ...filters, name },
    filtered,
    pageItems: paged.items,
    page: paged.page,
    pageCount: paged.pageCount,
    setPage,
    typeOptions,
    rarityOptions,
    hasActiveFilters: hasActiveAdminCardFilters({ ...filters, name }),
    countLabel: formatAdminCardCount(filtered.length, catalog.length),
    setName,
    setStatus,
    setEnergyType,
    setRarity,
    clearFilters,
  };
}

export { useAdminCardList };
