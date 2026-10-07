import { formatCardNumber } from "@/lib/card-number";

function UndiscoveredCard({ number }: { number: number }) {
  const label = formatCardNumber(number);

  return (
    <div
      data-slot="undiscovered-card"
      aria-label={`Carta ${label} não obtida`}
      className="flex aspect-63/88 w-full flex-col items-center justify-center gap-3 rounded-[4%] bg-muted"
    >
      <span aria-hidden className="text-6xl leading-none font-semibold text-foreground-subtle">
        ?
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground-subtle">{label}</span>
    </div>
  );
}

export { UndiscoveredCard };
