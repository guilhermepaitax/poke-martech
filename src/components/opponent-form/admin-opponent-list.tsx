"use client";

import Image from "next/image";
import Link from "next/link";
import { useFeatureFlag } from "@/components/feature-flags/use-feature-flags";
import { buttonVariants } from "@/components/ui/button";
import { useAdminOpponents } from "@/hooks/use-admin";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { DIFFICULTY_LABELS } from "@/lib/value-objects/battle";

function AdminOpponentList() {
  const opponents = useAdminOpponents();
  const registrationEnabled = useFeatureFlag(FEATURE_FLAGS.opponentRegistration);
  if (opponents.isLoading) return <p className="text-foreground-subtle">Carregando adversários...</p>;
  if (opponents.isError) return <p className="text-destructive">Não foi possível carregar os adversários.</p>;
  return (
    <div data-slot="admin-opponent-list" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Adversários</h1>
        {registrationEnabled ? (
          <Link href="/admin/adversarios/novo" className={buttonVariants()}>Novo adversário</Link>
        ) : null}
      </div>
      {opponents.data?.length ? (
        <ul className="flex flex-col gap-2">
          {opponents.data.map((opponent) => (
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
        <p className="text-foreground-subtle">Nenhum adversário cadastrado.</p>
      )}
    </div>
  );
}

export { AdminOpponentList };
