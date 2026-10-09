"use client";

import { PasswordRequirements } from "@/components/auth-form/password-requirements";
import { useAuthForm, type AuthMode } from "@/components/auth-form/use-auth-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import Link from "next/link";

function AuthForm({ mode }: { mode: AuthMode }) {
  const form = useAuthForm(mode);
  const isSignUp = mode === "sign-up";

  return (
    <Card data-slot="auth-form" className="w-full p-6 sm:p-8">
      <CardHeader className="gap-2">
        <CardTitle className="text-2xl tracking-tight">
          {isSignUp ? "Criar conta" : "Entrar"}
        </CardTitle>
        <p className="text-sm leading-relaxed text-foreground-subtle">
          {isSignUp
            ? "Nome, usuário e uma senha que você consiga lembrar."
            : "Use o e-mail e a senha da sua conta."}
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            form.submit();
          }}
        >
          {isSignUp ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={form.values.name}
                  onChange={(event) => form.update({ name: event.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={form.values.username}
                  onChange={(event) => form.update({ username: event.target.value })}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Letras minúsculas, números e hífens. Exemplo: ana-silva
                </p>
              </div>
            </>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.values.email}
              onChange={(event) => form.update({ email: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby={isSignUp ? "password-requirements" : undefined}
              aria-invalid={form.passwordInvalid || undefined}
              value={form.values.password}
              onChange={(event) => form.update({ password: event.target.value })}
              required
            />
            {isSignUp ? (
              <PasswordRequirements
                checks={form.passwordChecks}
                invalid={form.passwordInvalid}
              />
            ) : null}
          </div>
          {form.mutation.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {form.mutation.error.message}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="mt-1 w-full" disabled={form.mutation.isPending}>
            {form.mutation.isPending
              ? "Aguarde"
              : isSignUp
                ? "Criar conta"
                : "Entrar"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-foreground-subtle">
          {isSignUp ? "Já tem conta? " : "Ainda não tem conta? "}
          <Link
            href={isSignUp ? "/entrar" : "/cadastrar"}
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSignUp ? "Entrar" : "Criar conta"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export { AuthForm };
