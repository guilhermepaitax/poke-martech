"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { FINISH_LABELS, RARITY_LABELS } from "@/lib/value-objects/card";
import { useAdminBoosters } from "@/hooks/use-admin";
import { useListLocation } from "@/hooks/use-list-location";
import { withReturnTo } from "@/lib/return-path";
import { Booster3D } from "@/components/booster-3d/booster-3d";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function AdminBoosterList() {
  const boosters = useAdminBoosters();
  const here = useListLocation();
  if (boosters.isLoading) {
    return (
      <LoadingScreen label="Carregando pacotes" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <ListSkeleton count={4} thumb="pack" />
      </LoadingScreen>
    );
  }
  if (boosters.isError) return <p className="text-destructive">Não foi possível carregar os pacotes.</p>;
  const items = boosters.data ?? [];
  return (
    <div
      data-slot="admin-booster-list"
      className={cn(
        "flex flex-col gap-4",
        items.length === 0 && "min-h-[calc(100dvh-16rem)] md:min-h-[calc(100dvh-13rem)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Pacotes</h1>
        <Link href={withReturnTo("/admin/boosters/novo", here)} className={buttonVariants()}>Novo pacote</Link>
      </div>
      {items.length ? (
        <ul className="flex flex-col gap-2">
          {items.map((booster) => (
            <li key={booster.id}>
              <Link href={withReturnTo(`/admin/boosters/${booster.id}`, here)} className="glass flex items-center gap-3 rounded-3xl px-3 py-3">
                <Booster3D
                  className="w-10 shrink-0"
                  name={booster.name}
                  imageUrl={booster.imageUrl}
                  finish={booster.finish}
                  effects={false}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{booster.name}</span>
                  <span className="block text-sm text-foreground-subtle">
                    {booster.price} moedas · {FINISH_LABELS[booster.finish]}
                  </span>
                  {booster.featuredSlotMinRarity ? (
                    <span className="block text-sm text-foreground-subtle">
                      Mínimo {RARITY_LABELS[booster.featuredSlotMinRarity]}
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-foreground-subtle">{booster.active ? "Ativo" : "Inativo"}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          placement="fill"
          icon={Package}
          title="Nenhum pacote cadastrado"
          description="Monte um pacote com preço, estoque e as cartas que podem sair na abertura."
          action={
            <Link href={withReturnTo("/admin/boosters/novo", here)} className={buttonVariants()}>
              Novo pacote
            </Link>
          }
        />
      )}
    </div>
  );
}

export { AdminBoosterList };
