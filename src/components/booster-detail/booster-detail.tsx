"use client";

import { Booster3D } from "@/components/booster-3d/booster-3d";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useBooster, useOpenBooster } from "@/hooks/use-boosters";
import { useProfile } from "@/hooks/use-profile";
import { RARITY_LABELS } from "@/lib/value-objects/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

function BoosterDetail({ slug }: { slug: string }) {
  const booster = useBooster(slug);
  const profile = useProfile();
  const open = useOpenBooster(slug);
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);

  if (booster.isLoading)
    return <p className="text-foreground-subtle">Carregando pacote...</p>;
  if (booster.isError || !booster.data) {
    return <p className="text-destructive">Pacote não encontrado.</p>;
  }

  const item = booster.data;
  const balanceReady = profile.data != null;
  const coins = profile.data?.coins ?? 0;
  const soldOut = item.stock === 0;
  const poor = balanceReady && coins < item.price;
  const missing = Math.max(0, item.price - coins);

  return (
    <div
      data-slot="booster-detail"
      className="grid items-start gap-8 md:grid-cols-[16rem_1fr]"
    >
      <Booster3D
        className="mx-auto w-full max-w-64"
        name={item.name}
        imageUrl={item.imageUrl}
        finish={item.finish}
      />
      <div className="glass flex flex-col gap-4 rounded-3xl p-6">
        <h1 className="text-4xl font-bold tracking-tight">{item.name}</h1>
        {item.description ? (
          <p className="max-w-prose text-foreground-subtle">
            {item.description}
          </p>
        ) : null}
        <p className="text-3xl font-semibold tabular-nums text-yellow-500">
          {item.price} moedas
        </p>
        <p className="text-sm text-foreground-subtle">
          {!balanceReady
            ? "Carregando saldo..."
            : soldOut
              ? "Este pacote acabou."
              : poor
                ? `Faltam ${missing} moedas. Você tem ${coins}.`
                : `Você tem ${coins} moedas.`}
        </p>
        <p>{item.cardsPerPack} cartas por pacote</p>
        <p className="text-sm text-foreground-subtle">
          {item.stock == null
            ? "Estoque ilimitado"
            : `${item.stock} disponíveis`}
        </p>
        {item.featuredSlotMinRarity ? (
          <p className="text-sm text-foreground-subtle">
            A última carta sai no mínimo{" "}
            {RARITY_LABELS[item.featuredSlotMinRarity]}.
          </p>
        ) : null}
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Comprar pacote"
          description={`Gastar ${item.price} moedas para abrir ${item.name}?`}
          confirmLabel="Comprar"
          pending={open.isPending}
          onConfirm={() => {
            open.mutate(undefined, {
              onSuccess: (opening) => router.push(`/abertura/${opening.id}`),
            });
          }}
        >
          <Button
            disabled={soldOut || poor || !balanceReady || open.isPending}
            onClick={() => setConfirm(true)}
          >
            {soldOut ? "Esgotado" : poor ? "Moedas insuficientes" : "Comprar"}
          </Button>
        </ConfirmDialog>
        {open.isError ? (
          <p className="text-sm text-destructive">{open.error.message}</p>
        ) : null}
      </div>
    </div>
  );
}

export { BoosterDetail };
