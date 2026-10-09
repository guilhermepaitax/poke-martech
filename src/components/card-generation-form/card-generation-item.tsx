import Link from "next/link";
import { HoloCard } from "@/components/holo-card/holo-card";
import { withReturnTo } from "@/lib/return-path";
import { cn } from "@/lib/utils";
import type { CardGenerationItemView } from "@/types/catalog";

interface CardGenerationItemProps {
  item: CardGenerationItemView;
  active: boolean;
  returnTo: string;
}

function CardGenerationItem({ item, active, returnTo }: CardGenerationItemProps) {
  const card = item.card;
  const href = card ? withReturnTo(`/admin/cartas/${card.id}`, returnTo) : "";

  return (
    <li data-slot="card-generation-item" className="flex flex-col gap-2">
      {card ? (
        <Link
          href={href}
          className="rounded-[4%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HoloCard
            name={card.name}
            imageUrl={card.imageUrl}
            rarity={card.rarity}
            hp={card.hp}
            energyType={card.energyType}
            frame={card.frame}
            stage={card.stage}
            evolvesFrom={card.evolvesFrom}
            attacks={card.attacks}
            retreatCost={card.retreatCost}
            weaknessType={card.weaknessType}
            weaknessModifier={card.weaknessModifier}
            flavorText={card.flavorText}
            imageX={card.imageX}
            imageY={card.imageY}
            imageScale={card.imageScale}
          />
        </Link>
      ) : (
        <div
          data-active={active && item.status === "pending" ? "" : undefined}
          className={cn(
            "glass flex aspect-[63/88] flex-col items-center justify-center gap-2 rounded-[4%] p-4 text-center text-sm text-foreground-subtle",
            "data-active:animate-pulse",
          )}
        >
          {item.status === "failed" ? (
            <>
              <p className="font-semibold text-destructive">Falhou</p>
              <p className="break-words">{item.error}</p>
            </>
          ) : item.status === "done" ? (
            <p>Carta removida.</p>
          ) : (
            <p>{active ? "Gerando carta..." : "Na fila"}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-0.5 text-center text-sm text-foreground-subtle">
        {card ? (
          <Link href={href} className="font-semibold text-foreground hover:underline">
            Revisar {card.name}
          </Link>
        ) : null}
        {item.sourceUrl ? (
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="truncate hover:underline">
            Inspiração: {item.sourceName ?? "pokemon-zone"}
          </a>
        ) : (
          <span>Criatura livre</span>
        )}
      </div>
    </li>
  );
}

export { CardGenerationItem };
