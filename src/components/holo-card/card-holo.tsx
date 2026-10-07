import { useCardSurface } from "./card-surface";

function CardHolo({ scope }: { scope: "card" | "portrait" }) {
  const { finish, effects } = useCardSurface();
  if (!effects.holo) return null;

  if (scope === "portrait") {
    if (finish !== "satin") return null;
    return (
      <div
        data-slot="card-holo"
        data-scope={scope}
        aria-hidden
        className="card-holo-bars"
      />
    );
  }

  return (
    <div
      data-slot="card-holo"
      data-scope={scope}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      {finish === "mirror" ? <div className="card-holo-rainbow" /> : null}
      {finish === "prism" ? <div className="card-holo-prism" /> : null}
      {finish === "mirror" || finish === "prism" ? (
        <div className="card-glitter" />
      ) : null}
      <div className="card-glare" />
    </div>
  );
}

export { CardHolo };
