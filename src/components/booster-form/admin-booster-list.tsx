"use client";

import Link from "next/link";
import { FINISH_LABELS, RARITY_LABELS } from "@/lib/value-objects/card";
import { useAdminBoosters } from "@/hooks/use-admin";
import { Booster3D } from "@/components/booster-3d/booster-3d";
import { buttonVariants } from "@/components/ui/button";

function AdminBoosterList() {
  const boosters = useAdminBoosters();
  if (boosters.isLoading) return <p className="text-foreground-subtle">Carregando pacotes...</p>;
  if (boosters.isError) return <p className="text-destructive">Não foi possível carregar os pacotes.</p>;
  return (
    <div data-slot="admin-booster-list" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Pacotes</h1>
        <Link href="/admin/boosters/novo" className={buttonVariants()}>Novo pacote</Link>
      </div>
      {boosters.data?.length ? (
        <ul className="flex flex-col gap-2">
          {boosters.data.map((booster) => (
            <li key={booster.id}>
              <Link href={`/admin/boosters/${booster.id}`} className="glass flex items-center gap-3 rounded-3xl px-3 py-3">
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
        <p className="text-foreground-subtle">Nenhum pacote cadastrado.</p>
      )}
    </div>
  );
}

export { AdminBoosterList };
