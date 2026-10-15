"use client";

import { errorDescription, useToast } from "@/components/ui/toaster";
import {
  useAdminBooster,
  useAdminCards,
  useSaveBooster,
} from "@/hooks/use-admin";
import { useReturnTo } from "@/hooks/use-list-location";
import { pokemonTypeName, usePokemonTypes } from "@/hooks/use-pokemon-types";
import { optimizeImage } from "@/lib/image-processing";
import { slugify } from "@/lib/slug";
import {
  FINISH_LABELS,
  FINISHES,
  RARITIES,
  RARITY_LABELS,
  type EnergyType,
} from "@/lib/value-objects/card";
import {
  cardHasTag,
  foldText,
  normalizeCardTags,
} from "@/lib/value-objects/card-tag";
import { uploadImage } from "@/services/http";
import type { BoosterInput } from "@/types/catalog";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  allVisibleCardsSelected,
  filterBoosterCatalog,
  selectVisibleCards,
} from "./filter-booster-cards";

const emptyBooster: BoosterInput = {
  name: "",
  slug: "",
  imageUrl: null,
  description: "",
  price: 100,
  cardsPerPack: 5,
  stock: null,
  featuredSlotMinRarity: "rare",
  finish: "mirror",
  active: false,
  cards: [],
};

function useBoosterForm(boosterId?: string) {
  const router = useRouter();
  const returnTo = useReturnTo("/admin/boosters");
  const { pushToast } = useToast();
  const existing = useAdminBooster(boosterId ?? "");
  const catalog = useAdminCards();
  const types = usePokemonTypes();
  const save = useSaveBooster(boosterId);
  const slugTouched = useRef(false);
  const [draft, setDraft] = useState<BoosterInput | null>(
    boosterId ? null : emptyBooster,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cardQuery, setCardQuery] = useState("");
  const [energyTypes, setEnergyTypes] = useState<EnergyType[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const serverValues: BoosterInput = existing.data
    ? {
        name: existing.data.name,
        slug: existing.data.slug,
        imageUrl: existing.data.imageUrl,
        description: existing.data.description,
        price: existing.data.price,
        cardsPerPack: existing.data.cardsPerPack,
        stock: existing.data.stock,
        featuredSlotMinRarity: existing.data.featuredSlotMinRarity,
        finish: existing.data.finish,
        active: existing.data.active,
        cards: existing.data.cards,
      }
    : emptyBooster;
  const form = draft ?? serverValues;
  const catalogCards = useMemo(() => catalog.data ?? [], [catalog.data]);
  const visibleCatalog = filterBoosterCatalog(catalogCards, {
    name: cardQuery,
    energyTypes,
    tags,
  });
  const typeOptions = useMemo(
    () =>
      catalogCards
        .map((card) => card.energyType)
        .filter((type, index, all) => all.indexOf(type) === index)
        .sort((left, right) =>
          pokemonTypeName(types.data, left).localeCompare(
            pokemonTypeName(types.data, right),
            "pt-BR",
          ),
        ),
    [catalogCards, types.data],
  );
  const tagOptions = useMemo(
    () =>
      normalizeCardTags(catalogCards.flatMap((card) => card.tags)).sort(
        (left, right) => left.localeCompare(right, "pt-BR"),
      ),
    [catalogCards],
  );

  function update(patch: Partial<BoosterInput>) {
    if ("slug" in patch) slugTouched.current = true;
    setDraft((current) => {
      const base = current ?? serverValues;
      const next = { ...base, ...patch };
      if (
        !("slug" in patch) &&
        patch.name !== undefined &&
        !slugTouched.current
      )
        next.slug = slugify(patch.name);
      return next;
    });
  }

  function toggleCard(cardId: string) {
    setDraft((current) => {
      const base = current ?? serverValues;
      const selected = base.cards.some((item) => item.cardId === cardId);
      return {
        ...base,
        cards: selected
          ? base.cards.filter((item) => item.cardId !== cardId)
          : [...base.cards, { cardId, weightOverride: null }],
      };
    });
  }

  function toggleEnergy(energy: EnergyType) {
    setEnergyTypes((current) =>
      current.includes(energy)
        ? current.filter((item) => item !== energy)
        : [...current, energy],
    );
  }

  function toggleTag(tag: string) {
    setTags((current) =>
      cardHasTag(current, tag)
        ? current.filter((item) => foldText(item) !== foldText(tag))
        : normalizeCardTags([...current, tag]),
    );
  }

  function selectVisible() {
    const visibleIds = visibleCatalog.map((card) => card.id);
    setDraft((current) => {
      const base = current ?? serverValues;
      return { ...base, cards: selectVisibleCards(base.cards, visibleIds) };
    });
  }

  function clearCards() {
    setDraft((current) => {
      const base = current ?? serverValues;
      return { ...base, cards: [] };
    });
  }

  function setWeight(cardId: string, weightOverride: number | null) {
    setDraft((current) => {
      const base = current ?? serverValues;
      return {
        ...base,
        cards: base.cards.map((item) =>
          item.cardId === cardId ? { ...item, weightOverride } : item,
        ),
      };
    });
  }

  function saveForm() {
    save.mutate(form, {
      onSuccess: () => {
        setDraft(null);
        pushToast({ tone: "success", title: "Pacote salvo" });
        router.push(returnTo);
      },
      onError: (error) => {
        pushToast({
          tone: "error",
          title: "Não foi possível salvar o pacote",
          description: errorDescription(error),
        });
      },
    });
  }

  async function onFile(file: File) {
    setUploadError(null);
    setUploading(true);
    const local = URL.createObjectURL(file);
    update({ imageUrl: local });
    try {
      const uploaded = await uploadImage(await optimizeImage(file));
      update({ imageUrl: uploaded.url });
      URL.revokeObjectURL(local);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Falha no upload.",
      );
    } finally {
      setUploading(false);
    }
  }

  return {
    form,
    update,
    toggleCard,
    toggleEnergy,
    toggleTag,
    selectVisible,
    clearCards,
    setWeight,
    saveForm,
    onFile,
    uploadError,
    uploading,
    cardQuery,
    setCardQuery,
    energyTypes,
    tags,
    typeOptions,
    tagOptions,
    visibleCatalog,
    allVisibleSelected: allVisibleCardsSelected(
      form.cards,
      visibleCatalog.map((card) => card.id),
    ),
    isDirty: boosterId ? draft !== null : true,
    isLoading: Boolean(boosterId) && existing.isLoading,
    isMissing: Boolean(boosterId) && existing.isError,
    isPending: save.isPending,
    error: save.error,
    catalog: catalog.data ?? [],
  };
}

const rarityOptions = [
  { value: "none", label: "Sem mínimo" },
  ...RARITIES.map((value) => ({ value, label: RARITY_LABELS[value] })),
];

const finishOptions = FINISHES.map((value) => ({
  value,
  label: FINISH_LABELS[value],
}));

export { finishOptions, rarityOptions, useBoosterForm };
