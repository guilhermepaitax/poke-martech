const STEPS = [
  {
    title: "Abra um pacote",
    body: "A loja troca moedas por pacotes. A carta que sair é sua.",
  },
  {
    title: "Guarde na Pokédex",
    body: "O que você tem aparece aberto. O resto fica coberto até você encontrar.",
  },
  {
    title: "Troque ou batalhe",
    body: "Proponha uma troca ou monte um deck e entre na batalha.",
  },
] as const;

function LandingPlay() {
  return (
    <section
      data-slot="landing-play"
      className="bg-landing-ink px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display max-w-[14ch] text-4xl leading-none text-landing-paper sm:text-5xl font-bold">
          Depois da conta
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex items-center justify-center gap-3"
            >
              <p className="font-display text-9xl leading-none text-landing-gold font-extrabold">
                {index + 1}
              </p>
              <div>
                <h3 className="mt-4 font-display text-2xl leading-tight text-landing-paper">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[32ch] text-base leading-relaxed text-landing-paper/80">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export { LandingPlay };
