"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { formatCardNumber } from "@/lib/card-number";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";
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

  if (profile.isLoading)
    return <p className="text-foreground-subtle">Carregando...</p>;
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
      </div>
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
            <CardTitle>Outro treinador</CardTitle>
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
          <p className="text-sm text-foreground-subtle">
            Nenhuma carta ainda. Passe na loja.
          </p>
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
