"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { pokemonTypeName, usePokemonTypes } from "@/hooks/use-pokemon-types";
import { formatCardNumber } from "@/lib/card-number";
import { RARITY_LABELS } from "@/lib/value-objects/card";
import { useAdminCards } from "@/hooks/use-admin";
import { useFeatureFlag } from "@/components/feature-flags/use-feature-flags";
import { buttonVariants } from "@/components/ui/button";
import { FEATURE_FLAGS } from "@/lib/feature-flags";

function AdminCardList() {
  const cards = useAdminCards();
  const types = usePokemonTypes();
  const aiGenerationEnabled = useFeatureFlag(FEATURE_FLAGS.aiCardGeneration);
  if (cards.isLoading) return <p className="text-foreground-subtle">Carregando cartas...</p>;
  if (cards.isError) return <p className="text-destructive">Não foi possível carregar as cartas.</p>;
  return (
    <div data-slot="admin-card-list" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Cartas</h1>
        <div className="flex flex-wrap gap-2">
          {aiGenerationEnabled ? (
            <Link href="/admin/cartas/gerar" className={buttonVariants({ variant: "outline" })}>
              <Sparkles className="size-4" />
              Gerar com IA
            </Link>
          ) : null}
          <Link href="/admin/cartas/nova" className={buttonVariants()}>Nova carta</Link>
        </div>
      </div>
      {cards.data?.length ? (
        <ul className="flex flex-col gap-2">
          {cards.data.map((card) => (
            <li key={card.id}>
              <Link href={`/admin/cartas/${card.id}`} className="glass flex items-center gap-3 rounded-3xl px-3 py-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {card.imageUrl ? <Image src={card.imageUrl} alt="" fill className="object-cover" sizes="56px" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">
                    <span className="mr-2 tabular-nums text-foreground-subtle">{formatCardNumber(card.number)}</span>
                    {card.name}
                  </span>
                  <span className="block text-sm text-foreground-subtle">{pokemonTypeName(types.data, card.energyType)}</span>
                  <span className="block text-sm text-foreground-subtle">{RARITY_LABELS[card.rarity]}</span>
                </span>
                <span className="text-sm text-foreground-subtle">{card.published ? "Publicada" : "Rascunho"}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground-subtle">Nenhuma carta cadastrada.</p>
      )}
    </div>
  );
}

export { AdminCardList };
