"use client";

import Image from "next/image";
import Link from "next/link";
import { Swords } from "lucide-react";
import { useFeatureFlag } from "@/components/feature-flags/use-feature-flags";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { useAdminOpponents } from "@/hooks/use-admin";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS } from "@/lib/value-objects/battle";

function AdminOpponentList() {
  const opponents = useAdminOpponents();
  const registrationEnabled = useFeatureFlag(FEATURE_FLAGS.opponentRegistration);
  if (opponents.isLoading) {
    return (
      <LoadingScreen label="Carregando adversários" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <ListSkeleton count={4} thumb="circle" />
      </LoadingScreen>
    );
  }
  if (opponents.isError) return <p className="text-destructive">Não foi possível carregar os adversários.</p>;
  const items = opponents.data ?? [];
  return (
    <div
      data-slot="admin-opponent-list"
      className={cn(
        "flex flex-col gap-4",
        items.length === 0 && "min-h-[calc(100dvh-16rem)] md:min-h-[calc(100dvh-13rem)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Adversários</h1>
        {registrationEnabled ? (
          <Link href="/admin/adversarios/novo" className={buttonVariants()}>Novo adversário</Link>
        ) : null}
      </div>
      {items.length ? (
        <ul className="flex flex-col gap-2">
          {items.map((opponent) => (
            <li key={opponent.id}>
              <Link href={`/admin/adversarios/${opponent.id}`} className="glass flex items-center gap-3 rounded-3xl px-3 py-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
                  {opponent.avatarUrl ? <Image src={opponent.avatarUrl} alt="" fill className="object-cover" sizes="48px" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{opponent.name}</span>
                  <span className="block text-sm text-foreground-subtle">
                    {DIFFICULTY_LABELS[opponent.difficulty]} · {opponent.rewardCoins} moedas
                  </span>
                </span>
                <span className="text-sm text-foreground-subtle">{opponent.active ? "Ativo" : "Inativo"}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          placement="fill"
          icon={Swords}
          title="Nenhum adversário cadastrado"
          description="Cadastre um treinador com deck e recompensa para ele aparecer no ginásio."
          action={
            registrationEnabled ? (
              <Link href="/admin/adversarios/novo" className={buttonVariants()}>
                Novo adversário
              </Link>
            ) : null
          }
        />
      )}
    </div>
  );
}

export { AdminOpponentList };
