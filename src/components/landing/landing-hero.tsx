import { HoloCard } from "@/components/holo-card/holo-card";
import {
  LANDING_CARD,
  landingShowcaseFace,
} from "@/components/landing/landing-example-card";
import { LandingLink } from "@/components/landing/landing-link";
import { LandingNav } from "@/components/landing/landing-nav";
import { formatCardNumber } from "@/lib/card-number";
import Image from "next/image";

function LandingHero({ signedIn }: { signedIn: boolean }) {
  const face = landingShowcaseFace();

  return (
    <section data-slot="landing-hero" className="bg-landing-dusk">
      <div className="relative h-[46vh] min-h-[18rem] sm:h-[85vh]">
        <Image
          src="/landing-page/banner.png"
          alt="Quatro criaturas do time em um penhasco ao pôr do sol."
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_22%]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-landing-dusk"
        />
        <LandingNav
          signedIn={signedIn}
          className="absolute inset-x-0 top-0 z-10"
        />
      </div>
      <div className="relative mx-auto grid w-full max-w-6xl items-start gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,36rem)_18rem] lg:gap-16 lg:pb-20 mt-[-5rem]">
        <div className="lg:pb-2">
          <Image
            src="/images/logo.png"
            alt="Logo do PokeMartech"
            width={240}
            height={240}
            className="object-contain"
          />
          <h1 className="font-display font-bold text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.92] tracking-tight text-landing-paper">
            Comece sua coleção!
          </h1>
          <p className="mt-5 max-w-[38ch] text-lg leading-relaxed text-landing-paper">
            Abra pacotes para começar a colecionar, troque com o time e leve o
            deck para a batalha.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {signedIn ? (
              <>
                <LandingLink href="/home">Abrir a coleção</LandingLink>
                <LandingLink href="/loja" tone="quiet">
                  Ir para a loja
                </LandingLink>
              </>
            ) : (
              <>
                <LandingLink href="/cadastrar">Criar conta</LandingLink>
                <LandingLink href="/entrar" tone="quiet">
                  Entrar
                </LandingLink>
              </>
            )}
          </div>
          {signedIn ? null : (
            <p className="mt-4 text-sm text-landing-paper/50">
              Resgate já 100 moedas, criando sua conta!
            </p>
          )}
        </div>
        <figure className="mx-auto w-full max-w-72 lg:mx-0 lg:-mt-40">
          <div className="landing-deal rotate-6">
            <HoloCard {...face} effects />
          </div>
          <figcaption className="mt-4 text-center text-sm text-landing-paper lg:text-left">
            <span className="font-bold text-amber-200">
              {LANDING_CARD.name},
            </span>{" "}
            {formatCardNumber(LANDING_CARD.number)}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export { LandingHero };
