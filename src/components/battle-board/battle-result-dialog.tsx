"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { BattleView } from "@/types/battle";
import { useState } from "react";

function BattleResultDialog({ battle }: { battle: BattleView }) {
  const won = battle.status === "won";
  const title = won ? "Vitória" : battle.status === "forfeited" ? "Você desistiu" : "Derrota";
  const description = won
    ? `Você ganhou ${battle.rewardCoins} moedas.`
    : "Tente de novo com outro deck ou adversário.";
  return (
    <div data-slot="battle-result-dialog" className="absolute inset-0 z-30 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="glass flex w-[min(22rem,calc(100%-2rem))] flex-col gap-3 rounded-3xl p-6 text-center">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-sm text-foreground-subtle">{description}</p>
        <Link href="/batalha">
          <Button className="w-full">Voltar ao ginásio</Button>
        </Link>
      </div>
    </div>
  );
}

function BattleForfeitButton({ onForfeit, pending }: { onForfeit: () => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Desistir da batalha?"
      description="Isso conta como derrota."
      confirmLabel="Desistir"
      pending={pending}
      onConfirm={onForfeit}
    >
      <Button variant="outline" size="sm" aria-label="Menu" onClick={() => setOpen(true)}>
        Menu
      </Button>
    </ConfirmDialog>
  );
}

export { BattleForfeitButton, BattleResultDialog };
