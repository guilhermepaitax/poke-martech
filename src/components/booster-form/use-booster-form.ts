"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminBooster, useAdminCards, useSaveBooster } from "@/hooks/use-admin";
import { optimizeImage } from "@/lib/image-processing";
import { uploadImage } from "@/services/http";
import { slugify } from "@/lib/slug";
import { FINISH_LABELS, FINISHES, RARITIES, RARITY_LABELS } from "@/lib/value-objects/card";
import type { BoosterInput } from "@/types/catalog";

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
  const existing = useAdminBooster(boosterId ?? "");
  const catalog = useAdminCards();
  const save = useSaveBooster(boosterId);
  const slugTouched = useRef(false);
  const [draft, setDraft] = useState<BoosterInput | null>(boosterId ? null : emptyBooster);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cardQuery, setCardQuery] = useState("");
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
  const term = cardQuery.trim().toLowerCase();
  const visibleCatalog = (catalog.data ?? []).filter((card) => card.name.toLowerCase().includes(term));

  function update(patch: Partial<BoosterInput>) {
    if ("slug" in patch) slugTouched.current = true;
    setDraft((current) => {
      const base = current ?? serverValues;
      const next = { ...base, ...patch };
      if (!("slug" in patch) && patch.name !== undefined && !slugTouched.current) next.slug = slugify(patch.name);
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

  function setWeight(cardId: string, weightOverride: number | null) {
    setDraft((current) => {
      const base = current ?? serverValues;
      return {
        ...base,
        cards: base.cards.map((item) => (item.cardId === cardId ? { ...item, weightOverride } : item)),
      };
    });
  }

  function saveForm() {
    save.mutate(form, {
      onSuccess: (result) => {
        setDraft(null);
        router.push(`/admin/boosters/${result.id}`);
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
      setUploadError(error instanceof Error ? error.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  return {
    form,
    update,
    toggleCard,
    setWeight,
    saveForm,
    onFile,
    uploadError,
    uploading,
    cardQuery,
    setCardQuery,
    visibleCatalog,
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

const finishOptions = FINISHES.map((value) => ({ value, label: FINISH_LABELS[value] }));

export { finishOptions, rarityOptions, useBoosterForm };
