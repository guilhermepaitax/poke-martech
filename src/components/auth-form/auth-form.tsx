"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useAuthForm, type AuthMode } from "./use-auth-form";

function AuthForm({ mode }: { mode: AuthMode }) {
  const form = useAuthForm(mode);
  const isSignUp = mode === "sign-up";

  return (
    <Card data-slot="auth-form" className="w-full max-w-md">
      <CardHeader>
        <p className="text-sm font-semibold text-primary">PokeMartech</p>
        <CardTitle>{isSignUp ? "Criar conta" : "Entrar"}</CardTitle>
        {isSignUp ? null : (
          <p className="text-sm text-foreground-subtle">Entre para ver sua Pokédex e a loja.</p>
        )}
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            form.mutation.mutate(form.values);
          }}
        >
          {isSignUp ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.values.name}
                  onChange={(event) => form.update({ name: event.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={form.values.username}
                  onChange={(event) => form.update({ username: event.target.value })}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
              </div>
            </>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.values.email}
              onChange={(event) => form.update({ email: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={8}
              value={form.values.password}
              onChange={(event) => form.update({ password: event.target.value })}
              required
            />
          </div>
          {form.mutation.isError ? (
            <p className="text-sm text-destructive">{form.mutation.error.message}</p>
          ) : null}
          {isSignUp ? (
            <p className="text-sm text-foreground-subtle">
              O cadastro entrega 100 moedas para abrir o primeiro pacote.
            </p>
          ) : null}
          <Button type="submit" disabled={form.mutation.isPending}>
            {isSignUp ? "Cadastrar" : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-foreground-subtle">
          {isSignUp ? (
            <Link href="/entrar" className="text-primary">
              Já tenho conta
            </Link>
          ) : (
            <Link href="/cadastrar" className="text-primary">
              Criar conta
            </Link>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export { AuthForm };
