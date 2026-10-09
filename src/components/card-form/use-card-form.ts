"use client";

import { useAdminCard, useAdminCards, useSaveCard } from "@/hooks/use-admin";
import { usePokemonTypes } from "@/hooks/use-pokemon-types";
import { slugify } from "@/lib/slug";
import {
  ENERGY_TYPES,
  FRAME_LABELS,
  FRAMES,
  RARITIES,
  RARITY_LABELS,
  STAGE_LABELS,
  STAGES,
} from "@/lib/value-objects/card";
import { cropImage, isLocalUrl, optimizeImage } from "@/lib/image-processing";
import { uploadImage } from "@/services/http";
import type { CardDecorationId } from "@/lib/card-decorations";
import type {
  Attack,
  CardArtwork,
  CardEvolutionOrigin,
  CardInput,
  CardSummary,
} from "@/types/catalog";
import { useReturnTo } from "@/hooks/use-list-location";
import { errorDescription, useToast } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const artworkDefaults: CardArtwork = {
  imageX: 50,
  imageY: 50,
  imageScale: 100,
  overlayImageUrl: null,
  overlayX: 50,
  overlayY: 50,
  overlayScale: 100,
  decorationAsset: null,
  decorationImageUrl: null,
};

type UploadTarget = "imageUrl" | "overlayImageUrl" | "decorationImageUrl";

type PortraitPatch = Pick<CardInput, "imageUrl" | "imageX" | "imageY" | "imageScale">;

const emptyCard: CardInput = {
  name: "",
  slug: "",
  imageUrl: null,
  ...artworkDefaults,
  hp: 60,
  energyType: "ia",
  stage: "basic",
  frame: "basic",
  evolvesFromId: null,
  retreatCost: 1,
  weaknessType: null,
  weaknessModifier: 20,
  rarity: "common",
  flavorText: "",
  published: false,
  attacks: [
    {
      name: "Golpe",
      damage: 20,
      effectText: "",
      effects: [],
      energyCost: [{ type: "ia", count: 1 }],
      sortOrder: 0,
    },
  ],
};

function toInput(card: CardInput): CardInput {
  return {
    name: card.name,
    slug: card.slug,
    imageUrl: card.imageUrl,
    imageX: card.imageX,
    imageY: card.imageY,
    imageScale: card.imageScale,
    overlayImageUrl: card.overlayImageUrl,
    overlayX: card.overlayX,
    overlayY: card.overlayY,
    overlayScale: card.overlayScale,
    decorationAsset: card.decorationAsset,
    decorationImageUrl: card.decorationImageUrl,
    hp: card.hp,
    energyType: card.energyType,
    stage: card.stage,
    frame: card.frame,
    evolvesFromId: card.evolvesFromId,
    retreatCost: card.retreatCost,
    weaknessType: card.weaknessType,
    weaknessModifier: card.weaknessModifier,
    rarity: card.rarity,
    flavorText: card.flavorText,
    published: card.published,
    attacks: card.attacks.map((attack) => ({ ...attack, effects: attack.effects ?? [] })),
  };
}

function useCardForm(cardId?: string) {
  const router = useRouter();
  const returnTo = useReturnTo("/admin/cartas");
  const { pushToast } = useToast();
  const types = usePokemonTypes();
  const existing = useAdminCard(cardId ?? "");
  const catalog = useAdminCards();
  const save = useSaveCard(cardId);
  const slugTouched = useRef(false);
  const pendingPortrait = useRef<{ file: File; url: string } | null>(null);
  const [draft, setDraft] = useState<CardInput | null>(
    cardId ? null : emptyCard,
  );
  const [uploadError, setUploadError] = useState<{
    target: UploadTarget;
    message: string;
  } | null>(null);
  const [uploading, setUploading] = useState<UploadTarget | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  const serverValues = existing.data ? toInput(existing.data) : emptyCard;
  const form = draft ?? serverValues;
  const isDirty = draft !== null;
  const origin = form.evolvesFromId
    ? catalog.data?.find((card) => card.id === form.evolvesFromId)
    : undefined;
  const evolvesFrom: CardEvolutionOrigin | null = origin
    ? { name: origin.name, imageUrl: origin.imageUrl }
    : null;

  function update(patch: Partial<CardInput>) {
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

  function updateAttack(index: number, patch: Partial<Attack>) {
    setDraft((current) => {
      const base = current ?? serverValues;
      return {
        ...base,
        attacks: base.attacks.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item,
        ),
      };
    });
  }

  function addAttack() {
    setDraft((current) => {
      const base = current ?? serverValues;
      return {
        ...base,
        attacks: [
          ...base.attacks,
          {
            name: "Novo ataque",
            damage: null,
            effectText: "",
            effects: [],
            energyCost: [{ type: "ia", count: 1 }],
            sortOrder: base.attacks.length,
          },
        ],
      };
    });
  }

  function removeAttack(index: number) {
    setDraft((current) => {
      const base = current ?? serverValues;
      return {
        ...base,
        attacks: base.attacks
          .filter((_, itemIndex) => itemIndex !== index)
          .map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
      };
    });
  }

  async function bakePortrait(values: CardInput): Promise<PortraitPatch | null> {
    const source = values.imageUrl;
    if (!source) return null;
    const pending = pendingPortrait.current;
    const isPending = pending?.url === source;
    const changed =
      source !== serverValues.imageUrl ||
      values.imageX !== serverValues.imageX ||
      values.imageY !== serverValues.imageY ||
      values.imageScale !== serverValues.imageScale;
    if (!isPending && (!changed || isLocalUrl(source))) return null;
    const placement = {
      x: values.imageX,
      y: values.imageY,
      scale: values.imageScale,
    };
    let file: File;
    try {
      file = await cropImage(source, placement, pending?.file.name ?? "carta");
    } catch (error) {
      if (isPending) throw error;
      return null;
    }
    const uploaded = await uploadImage(file);
    if (isPending) {
      URL.revokeObjectURL(pending.url);
      pendingPortrait.current = null;
    }
    return { imageUrl: uploaded.url, imageX: 50, imageY: 50, imageScale: 100 };
  }

  async function saveForm() {
    setUploadError(null);
    setOptimizing(true);
    let payload = form;
    try {
      const portrait = await bakePortrait(form);
      if (portrait) {
        payload = { ...form, ...portrait };
        update(portrait);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no upload.";
      setUploadError({
        target: "imageUrl",
        message,
      });
      pushToast({
        tone: "error",
        title: "Não foi possível salvar a carta",
        description: message,
      });
      return;
    } finally {
      setOptimizing(false);
    }
    save.mutate(payload, {
      onSuccess: () => {
        setDraft(null);
        pushToast({ tone: "success", title: "Carta salva" });
        router.push(returnTo);
      },
      onError: (error) => {
        pushToast({
          tone: "error",
          title: "Não foi possível salvar a carta",
          description: errorDescription(error),
        });
      },
    });
  }

  function selectDecoration(asset: CardDecorationId | null) {
    update({ decorationAsset: asset, decorationImageUrl: null });
  }

  function selectPortrait(file: File) {
    if (pendingPortrait.current) URL.revokeObjectURL(pendingPortrait.current.url);
    const url = URL.createObjectURL(file);
    pendingPortrait.current = { file, url };
    setUploadError(null);
    update({ imageUrl: url });
  }

  async function onFile(file: File, target: UploadTarget = "imageUrl") {
    if (target === "imageUrl") {
      selectPortrait(file);
      return;
    }
    setUploadError(null);
    setUploading(target);
    const local = URL.createObjectURL(file);
    update({
      [target]: local,
      ...(target === "decorationImageUrl" ? { decorationAsset: null } : {}),
    });
    try {
      const uploaded = await uploadImage(await optimizeImage(file));
      update({
        [target]: uploaded.url,
        ...(target === "decorationImageUrl" ? { decorationAsset: null } : {}),
      });
      URL.revokeObjectURL(local);
    } catch (error) {
      setUploadError({
        target,
        message: error instanceof Error ? error.message : "Falha no upload.",
      });
    } finally {
      setUploading(null);
    }
  }

  function errorFor(target: UploadTarget) {
    return uploadError?.target === target ? uploadError.message : null;
  }

  return {
    form,
    evolvesFrom,
    update,
    updateAttack,
    addAttack,
    removeAttack,
    saveForm,
    onFile,
    selectDecoration,
    errorFor,
    uploading,
    optimizing,
    enlarged,
    setEnlarged,
    isDirty: cardId ? isDirty : true,
    isLoading: Boolean(cardId) && existing.isLoading,
    isMissing: Boolean(cardId) && existing.isError,
    isPending: save.isPending || optimizing,
    error: save.error,
    options: (catalog.data ?? []).filter((card) => card.id !== cardId),
    energyTypes: types.data?.length
      ? types.data
      : ENERGY_TYPES.map((code) => ({ code, name: code })),
  };
}

const stageOptions = STAGES.map((value) => ({
  value,
  label: STAGE_LABELS[value],
}));
const frameOptions = FRAMES.map((value) => ({
  value,
  label: FRAME_LABELS[value],
}));
const rarityOptions = RARITIES.map((value) => ({
  value,
  label: RARITY_LABELS[value],
}));

export { emptyCard, frameOptions, rarityOptions, stageOptions, useCardForm };
export type { CardSummary };
