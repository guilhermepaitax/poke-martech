"use client";

import { Booster3D } from "@/components/booster-3d/booster-3d";
import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { errorDescription, useToast } from "@/components/ui/toaster";
import { LoadingScreen, Skeleton } from "@/components/ui/skeleton";
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
  const { pushToast } = useToast();
  const [confirm, setConfirm] = useState(false);

  if (booster.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink fallback="/loja" />
        <LoadingScreen label="Carregando pacote" className="grid items-start gap-8 md:grid-cols-[16rem_1fr]">
        <Skeleton className="mx-auto aspect-[2/3] w-full max-w-64 rounded-2xl" />
        <div className="glass flex flex-col gap-4 rounded-3xl p-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </LoadingScreen>
      </div>
    );
  }
  if (booster.isError || !booster.data) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink fallback="/loja" />
        <p className="text-destructive">Pacote não encontrado.</p>
      </div>
    );
  }

  const item = booster.data;
  const balanceReady = profile.data != null;
  const coins = profile.data?.coins ?? 0;
  const soldOut = item.stock === 0;
  const poor = balanceReady && coins < item.price;
  const missing = Math.max(0, item.price - coins);

  return (
    <div data-slot="booster-detail" className="flex flex-col gap-4">
      <BackLink fallback="/loja" />
      <div className="grid items-start gap-8 md:grid-cols-[16rem_1fr]">
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
        {!balanceReady ? (
          <Skeleton className="h-4 w-40" />
        ) : (
          <p className="text-sm text-foreground-subtle">
            {soldOut
              ? "Este pacote acabou."
              : poor
                ? `Faltam ${missing} moedas. Você tem ${coins}.`
                : `Você tem ${coins} moedas.`}
          </p>
        )}
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
              onSuccess: (opening) => {
                pushToast({ tone: "success", title: "Pacote comprado" });
                router.push(`/abertura/${opening.id}`);
              },
              onError: (error) => {
                pushToast({
                  tone: "error",
                  title: "Não foi possível comprar o pacote",
                  description: errorDescription(error),
                });
              },
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
      </div>
    </div>
    </div>
  );
}

export { BoosterDetail };
