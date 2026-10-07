const EX_RULE =
  "Quando seu Pokémon EX é nocauteado, seu oponente recebe 2 pontos.";

function CardExRule() {
  return (
    <div
      data-slot="card-ex-rule"
      className="ml-auto w-[68%] shrink-0 text-[0.46em] leading-tight"
    >
      <p className="w-fit rounded-t-[0.35em] bg-(--card-ex-rule-tab) px-[0.55em] py-[0.12em] font-bold text-(--card-paper)">
        regra EX
      </p>
      <p
        className="rounded-tr-[0.35em] rounded-b-[0.35em] px-[0.5em] py-[0.32em] text-(--card-ink)"
        style={{ background: "var(--card-ex-rule-band)" }}
      >
        {EX_RULE}
      </p>
    </div>
  );
}

export { CardExRule };
