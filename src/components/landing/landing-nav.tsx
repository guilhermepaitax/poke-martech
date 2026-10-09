import { LandingLink } from "@/components/landing/landing-link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

function LandingNav({
  signedIn,
  className,
}: {
  signedIn: boolean;
  className?: string;
}) {
  return (
    <header
      data-slot="landing-nav"
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-4 sm:px-6",
        className,
      )}
    >
      <Link href={signedIn ? "/home" : "/"} className="shrink-0">
        <Image
          src="/images/logo.png"
          alt="PokeMartech"
          width={180}
          height={54}
          priority
          className="h-10 w-auto sm:h-12"
        />
      </Link>
      <nav className="flex items-center gap-2">
        {signedIn ? (
          <LandingLink href="/home" size="nav">
            Abrir a coleção
          </LandingLink>
        ) : (
          <>
            <LandingLink
              href="/entrar"
              tone="quiet"
              size="nav"
              className="bg-landing-ink/55"
            >
              Entrar
            </LandingLink>
            <LandingLink href="/cadastrar" size="nav">
              Criar conta
            </LandingLink>
          </>
        )}
      </nav>
    </header>
  );
}

export { LandingNav };
