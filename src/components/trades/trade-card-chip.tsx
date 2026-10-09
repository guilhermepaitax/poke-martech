import { formatCardNumber } from "@/lib/card-number";
import type { TradeCardPreview } from "@/types/catalog";
import Image from "next/image";

function TradeCardChip({ card }: { card: TradeCardPreview }) {
  return (
    <div data-slot="trade-card-chip" className="flex min-w-0 items-center gap-3">
      {card.imageUrl ? (
        <Image
          src={card.imageUrl}
          alt=""
          width={40}
          height={56}
          className="h-14 w-10 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="h-14 w-10 shrink-0 rounded-md bg-muted" />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{card.name}</span>
        <span className="block text-xs font-semibold tabular-nums text-foreground-subtle">
          {formatCardNumber(card.number)}
        </span>
      </span>
    </div>
  );
}

export { TradeCardChip };
