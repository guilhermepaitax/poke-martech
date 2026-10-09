"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { TradeProposalList } from "@/components/trades/trade-proposal-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { CardGridSkeleton, LoadingScreen, ProposalSkeleton, Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { formatCardNumber } from "@/lib/card-number";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Coins, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function HomeDashboard() {
  const profile = useProfile();
  const router = useRouter();
  const [username, setUsername] = useState("");

  if (profile.isLoading) {
    return (
      <LoadingScreen label="Carregando" className="flex flex-col gap-8">
        <div>
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-3 h-6 w-32" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <ProposalSkeleton />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-36 rounded-3xl" />
          <Skeleton className="h-36 rounded-3xl" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-64" />
          <CardGridSkeleton count={4} />
        </div>
      </LoadingScreen>
    );
  }
  if (profile.isError || !profile.data) {
    return (
      <p className="text-destructive">Não foi possível carregar o perfil.</p>
    );
  }

  const me = profile.data;

  return (
    <div data-slot="home-dashboard" className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">
          Olá, {me.name}
        </h1>
        <p className="mt-3 text-xl font-semibold text-amber-600 flex items-center">
          <Coins className="size-5 mr-1 text-amber-600" />
          {me.coins} moedas
        </p>
        <p className="text-sm text-foreground-subtle">
          Saldo para abrir pacotes na loja.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/u/${me.username}`}
            className="glass rounded-full px-4 py-2 text-sm text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="font-semibold text-foreground">
              {me.followerCount}
            </span>{" "}
            {me.followerCount === 1 ? "seguidor" : "seguidores"}
          </Link>
          <Link
            href={`/u/${me.username}`}
            className="glass rounded-full px-4 py-2 text-sm text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="font-semibold text-foreground">
              {me.followingCount}
            </span>{" "}
            seguindo
          </Link>
        </div>
      </div>
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Propostas recebidas</h2>
          <Link
            href="/trocas"
            className="text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver trocas
          </Link>
        </div>
        {me.pendingTrades.length === 0 ? (
          <EmptyState
            placement="section"
            icon={ArrowLeftRight}
            title="Nenhuma proposta esperando você"
            description="As trocas que outros treinadores enviarem aparecem aqui, prontas para aceitar ou recusar."
          />
        ) : (
          <TradeProposalList proposals={me.pendingTrades} box="incoming" />
        )}
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Loja</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground-subtle">
              Abra um pacote com as moedas da conta.
            </p>
            <Link href="/loja" className={cn(buttonVariants(), "mt-4")}>
              Abrir pacotes
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Buscar outro treinador</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const next = username.trim().toLowerCase();
                if (next) router.push(`/u/${next}`);
              }}
            >
              <Input
                aria-label="Usuário"
                placeholder="usuário"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <Button type="submit">Ver</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Últimas cartas desbloqueadas</h2>
        {me.recentCards.length === 0 ? (
          <EmptyState
            placement="section"
            icon={Sparkles}
            title="Nenhuma carta ainda"
            description="Abra um pacote na loja para a primeira carta entrar na sua coleção."
            action={
              <Link href="/loja" className={buttonVariants()}>
                Ir para a loja
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {me.recentCards.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/pokedex/${card.cardId}`}
                  className="flex h-full flex-col gap-2 rounded-[4%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HoloCard {...card.card} />
                  <p className="text-center text-sm font-semibold tabular-nums text-foreground-subtle">
                    {formatCardNumber(card.number)}
                  </p>
                  <p className="text-center text-sm text-foreground-subtle">
                    {formatWhen(card.obtainedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export { HomeDashboard };
