import { AuthSleeve } from "@/components/auth-form/auth-sleeve";
import Image from "next/image";
import type { ReactNode } from "react";

const COPY = {
  "sign-in": {
    title: "Entre na coleção",
    description: "A Pokédex, a loja e as trocas ficam nesta conta.",
  },
  "sign-up": {
    title: "Abra sua primeira carta",
    description: "A conta nova começa com 100 moedas para o primeiro pacote.",
  },
} as const;

function AuthLayout({
  mode,
  children,
}: {
  mode: "sign-in" | "sign-up";
  children: ReactNode;
}) {
  const copy = COPY[mode];

  return (
    <main
      data-slot="auth-layout"
      className="flex min-h-dvh flex-col px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto my-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16">
        <section className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <Image
            src="/images/logo.png"
            alt="PokeMartech"
            width={240}
            height={72}
            priority
            className="h-12 w-auto sm:h-14"
          />
          <div className="flex max-w-md flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {copy.title}
            </h1>
            <p className="text-base leading-relaxed text-foreground-subtle">
              {copy.description}
            </p>
          </div>
          <AuthSleeve />
        </section>
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}

export { AuthLayout };
