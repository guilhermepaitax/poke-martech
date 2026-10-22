"use client";

import { cn } from "@/lib/utils";
import { Ban, Coins, TriangleAlert } from "lucide-react";

import type { ArenaReward } from "./use-arena-game";

type RewardView = {
  tone: "granted" | "muted" | "error" | "pending";
  amount: string;
  headline: string;
  caption: string;
  badge: "none" | "blocked" | "error";
  filled: number;
  fresh: number | null;
  limit: number | null;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function rewardView(reward: ArenaReward): RewardView {
  if (reward.status === "pending") {
    return {
      tone: "pending",
      amount: "…",
      headline: "Contando moedas",
      caption: "Só um instante.",
      badge: "none",
      filled: 0,
      fresh: null,
      limit: null,
    };
  }
  if (reward.status === "granted") {
    const left = reward.dailyLimit - reward.rewardedToday;
    return {
      tone: "granted",
      amount: `+${reward.amount}`,
      headline: "Recompensa da vitória",
      caption:
        left > 0
          ? `Ainda dá para ganhar moedas em mais ${plural(left, "vitória", "vitórias")} hoje.`
          : "Essa foi a última vitória premiada de hoje. Volte amanhã.",
      badge: "none",
      filled: reward.rewardedToday,
      fresh: reward.rewardedToday - 1,
      limit: reward.dailyLimit,
    };
  }
  if (reward.status === "capped") {
    return {
      tone: "muted",
      amount: "+0",
      headline: "Limite diário atingido",
      caption: `Você já ganhou moedas em ${reward.dailyLimit} vitórias hoje. Volte amanhã.`,
      badge: "blocked",
      filled: reward.dailyLimit,
      fresh: null,
      limit: reward.dailyLimit,
    };
  }
  if (reward.status === "defeat") {
    const left = reward.dailyLimit - reward.rewardedToday;
    return {
      tone: "muted",
      amount: "+0",
      headline: "Derrota não paga moedas",
      caption:
        left > 0
          ? `Vença para ganhar ${reward.potential} moedas. ${left === 1 ? "Resta 1 vitória premiada" : `Restam ${left} vitórias premiadas`} hoje.`
          : `Você já ganhou moedas em ${reward.dailyLimit} vitórias hoje. Volte amanhã.`,
      badge: "blocked",
      filled: reward.rewardedToday,
      fresh: null,
      limit: reward.dailyLimit,
    };
  }
  return {
    tone: "error",
    amount: "?",
    headline: "Moedas não creditadas",
    caption: "Não conseguimos registrar essa partida. Tente outra batalha.",
    badge: "error",
    filled: 0,
    fresh: null,
    limit: null,
  };
}

function ArenaRewardPanel({ reward, className }: { reward: ArenaReward; className?: string }) {
  const view = rewardView(reward);

  return (
    <div
      data-slot="arena-reward"
      data-tone={view.tone}
      role="status"
      aria-live="polite"
      className={cn("arena-reward relative flex flex-col gap-3 px-4 py-3 text-white", className)}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <span className="arena-reward-coin grid size-12 place-items-center rounded-full">
            <Coins aria-hidden className="size-6" strokeWidth={2.4} />
          </span>
          {view.badge === "blocked" ? (
            <Ban
              aria-hidden
              className="absolute -right-1 -bottom-1 size-5 rounded-full bg-black p-0.5 text-white/80"
              strokeWidth={2.6}
            />
          ) : null}
          {view.badge === "error" ? (
            <TriangleAlert
              aria-hidden
              className="absolute -right-1 -bottom-1 size-5 rounded-full bg-black p-0.5 text-destructive"
              strokeWidth={2.6}
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-[0.65rem] font-semibold tracking-widest text-white/60 uppercase">
            {view.headline}
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="arena-reward-amount font-arena-title text-4xl leading-none">
              {view.amount}
            </span>
            <span className="font-arena-title text-sm tracking-wider text-white/70 uppercase">
              moedas
            </span>
          </span>
        </div>
      </div>
      {view.limit ? (
        <div className="flex flex-col gap-1.5">
          <div aria-hidden className="flex gap-1.5">
            {Array.from({ length: view.limit }, (_, index) => (
              <span
                key={index}
                className="arena-reward-pip h-2 flex-1"
                data-filled={index < view.filled ? "" : undefined}
                data-fresh={index === view.fresh ? "" : undefined}
              />
            ))}
          </div>
          <span className="flex justify-between text-[0.65rem] font-semibold tracking-wider text-white/60 uppercase">
            <span>Vitórias premiadas hoje</span>
            <span className="tabular-nums">
              {view.filled}/{view.limit}
            </span>
          </span>
        </div>
      ) : null}
      <p className="text-xs leading-snug text-white/80">{view.caption}</p>
    </div>
  );
}

export { ArenaRewardPanel };
