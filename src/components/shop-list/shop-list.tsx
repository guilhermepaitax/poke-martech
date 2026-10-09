"use client";

import { Booster3D } from "@/components/booster-3d/booster-3d";
import { Badge } from "@/components/ui/badge";
import { EmptyState, screenColumnClass } from "@/components/ui/empty-state";
import { LoadingScreen, ShopGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useBoosters } from "@/hooks/use-boosters";
import { useListLocation } from "@/hooks/use-list-location";
import { withReturnTo } from "@/lib/return-path";
import { cn } from "@/lib/utils";
import { FINISH_LABELS, RARITY_LABELS } from "@/lib/value-objects/card";
import { Package } from "lucide-react";
import Link from "next/link";

function ShopList() {
  const boosters = useBoosters();
  const here = useListLocation();

  if (boosters.isLoading) {
    return (
      <LoadingScreen label="Carregando loja" className="flex flex-col gap-6">
        <Skeleton className="h-10 w-24" />
        <ShopGridSkeleton />
      </LoadingScreen>
    );
  }
  if (boosters.isError)
    return (
      <p className="text-destructive">Não foi possível carregar a loja.</p>
    );
  if (!boosters.data?.length) {
    return (
      <div data-slot="shop-list" className={cn(screenColumnClass, "gap-6")}>
        <h1 className="text-4xl font-semibold tracking-tight">Loja</h1>
        <EmptyState
          placement="fill"
          icon={Package}
          title="Nenhum pacote à venda"
          description="Quando um pacote estiver ativo no catálogo, ele aparece aqui para você abrir."
        />
      </div>
    );
  }

  return (
    <div data-slot="shop-list" className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-tight">Loja</h1>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {boosters.data.map((booster) => (
          <li key={booster.id}>
            <Link
              href={withReturnTo(`/loja/${booster.slug}`, here)}
              className="glass flex h-full flex-col gap-4 rounded-3xl p-4"
            >
              <Booster3D
                className="mx-auto w-3/4 py-2"
                name={booster.name}
                imageUrl={booster.imageUrl}
                finish={booster.finish}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{booster.name}</p>
                  <p className="text-xs text-foreground-subtle">
                    Acabamento {FINISH_LABELS[booster.finish].toLowerCase()}
                  </p>
                </div>
                <Badge variant="accent" className="shrink-0">
                  {booster.price} moedas
                </Badge>
              </div>
              {booster.description ? (
                <p className="line-clamp-2 text-sm text-foreground-subtle">
                  {booster.description}
                </p>
              ) : null}
              <p className="text-sm">
                {booster.cardsPerPack} cartas por pacote
              </p>
              <p className="text-sm text-foreground-subtle">
                {booster.stock == null
                  ? "Estoque ilimitado"
                  : `${booster.stock} disponíveis`}
              </p>
              {booster.featuredSlotMinRarity ? (
                <p className="text-sm text-foreground-subtle">
                  Última carta no mínimo{" "}
                  {RARITY_LABELS[booster.featuredSlotMinRarity]}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ShopList };
