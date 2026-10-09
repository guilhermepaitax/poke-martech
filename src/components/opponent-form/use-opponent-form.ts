"use client";

import { useRef, useState } from "react";
import { useReturnTo } from "@/hooks/use-list-location";
import { errorDescription, useToast } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useAdminCards, useAdminOpponent, useSaveOpponent } from "@/hooks/use-admin";
import { deriveEnergyTypes, MAX_COPIES } from "@/lib/battle/deck-rules";
import { optimizeImage } from "@/lib/image-processing";
import { slugify } from "@/lib/slug";
import { uploadImage } from "@/services/http";
import { BATTLE_DIFFICULTIES, DIFFICULTY_LABELS } from "@/lib/value-objects/battle";
import type { BattleOpponentInput } from "@/types/battle";
import type { EnergyType } from "@/lib/value-objects/card";

const emptyOpponent: BattleOpponentInput = {
  name: "",
  slug: "",
  avatarUrl: null,
  description: "",
  difficulty: "normal",
  rewardCoins: 20,
  energyTypes: [],
  active: false,
  sortOrder: 0,
  cards: [],
};

function useOpponentForm(opponentId?: string) {
  const router = useRouter();
  const returnTo = useReturnTo("/admin/adversarios");
  const { pushToast } = useToast();
  const existing = useAdminOpponent(opponentId ?? "");
  const catalog = useAdminCards();
  const save = useSaveOpponent(opponentId);
  const slugTouched = useRef(false);
  const [draft, setDraft] = useState<BattleOpponentInput | null>(opponentId ? null : emptyOpponent);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cardQuery, setCardQuery] = useState("");
  const serverValues: BattleOpponentInput = existing.data
    ? {
        name: existing.data.name,
        slug: existing.data.slug,
        avatarUrl: existing.data.avatarUrl,
        description: existing.data.description,
        difficulty: existing.data.difficulty,
        rewardCoins: existing.data.rewardCoins,
        energyTypes: existing.data.energyTypes,
        active: existing.data.active,
        sortOrder: existing.data.sortOrder,
        cards: existing.data.cards,
      }
    : emptyOpponent;
  const form = draft ?? serverValues;
  const term = cardQuery.trim().toLowerCase();
  const visibleCatalog = (catalog.data ?? []).filter((card) => card.name.toLowerCase().includes(term));
  const selected = form.cards
    .map((item) => {
      const card = catalog.data?.find((entry) => entry.id === item.cardId);
      return card ? { ...item, energyType: card.energyType, stage: card.stage } : null;
    })
    .filter((item) => item !== null);
  const availableEnergy = deriveEnergyTypes(selected.map((item) => ({ energyType: item.energyType, copies: item.copies })));

  function update(patch: Partial<BattleOpponentInput>) {
    if ("slug" in patch) slugTouched.current = true;
    setDraft((current) => {
      const base = current ?? serverValues;
      const next = { ...base, ...patch };
      if (!("slug" in patch) && patch.name !== undefined && !slugTouched.current) next.slug = slugify(patch.name);
      return next;
    });
  }

  function setCopies(cardId: string, copies: number) {
    setDraft((current) => {
      const base = current ?? serverValues;
      const others = base.cards.filter((item) => item.cardId !== cardId);
      const cards = copies < 1 ? others : [...others, { cardId, copies: Math.min(MAX_COPIES, copies) }];
      const types = deriveEnergyTypes(
        cards.flatMap((item) => {
          const card = catalog.data?.find((entry) => entry.id === item.cardId);
          return card ? [{ energyType: card.energyType as EnergyType, copies: item.copies }] : [];
        }),
      );
      return { ...base, cards, energyTypes: base.energyTypes.filter((type) => types.includes(type)).length ? base.energyTypes.filter((type) => types.includes(type)) : types };
    });
  }

  async function onFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await uploadImage(await optimizeImage(file));
      update({ avatarUrl: uploaded.url });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  function saveForm() {
    save.mutate(
      { ...form, energyTypes: form.energyTypes.length ? form.energyTypes : availableEnergy },
      {
        onSuccess: () => {
          pushToast({ tone: "success", title: "Adversário salvo" });
          router.push(returnTo);
        },
        onError: (error) => {
          pushToast({
            tone: "error",
            title: "Não foi possível salvar o adversário",
            description: errorDescription(error),
          });
        },
      },
    );
  }

  return {
    form,
    update,
    setCopies,
    onFile,
    saveForm,
    uploading,
    uploadError,
    cardQuery,
    setCardQuery,
    visibleCatalog,
    catalog: catalog.data ?? [],
    availableEnergy,
    isDirty: opponentId ? draft !== null : true,
    isLoading: Boolean(opponentId) && existing.isLoading,
    isMissing: Boolean(opponentId) && existing.isError,
    isPending: save.isPending,
    error: save.error,
  };
}

const difficultyOptions = BATTLE_DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] }));

export { difficultyOptions, useOpponentForm };
