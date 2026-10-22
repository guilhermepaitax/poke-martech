import type { ArenaFighter } from "@/lib/arena/fighter";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

type ArenaTitleTone = "victory" | "defeat" | "neutral" | "loading";

const CONFETTI = [
  { x: -220, y: -120, color: "var(--arena-cta)", delay: 0, ms: 1600 },
  { x: 200, y: -140, color: "white", delay: 120, ms: 1800 },
  { x: -160, y: 130, color: "var(--energy-psychic)", delay: 260, ms: 1500 },
  { x: 240, y: 90, color: "var(--arena-cta)", delay: 380, ms: 1700 },
  { x: -260, y: 20, color: "white", delay: 520, ms: 1900 },
  { x: 120, y: 160, color: "var(--energy-psychic)", delay: 640, ms: 1600 },
  { x: -80, y: -170, color: "var(--arena-cta)", delay: 760, ms: 1800 },
  { x: 280, y: -40, color: "white", delay: 880, ms: 1500 },
  { x: -300, y: -60, color: "var(--arena-cta)", delay: 1000, ms: 1700 },
  { x: 60, y: -190, color: "white", delay: 1120, ms: 1900 },
  { x: -40, y: 180, color: "var(--energy-psychic)", delay: 1240, ms: 1600 },
  { x: 180, y: 150, color: "var(--arena-cta)", delay: 1360, ms: 1800 },
] as const;

function ArenaTitleCard({
  title,
  accent,
  kicker,
  tone,
  fighter,
  confetti = tone === "victory",
  children,
  className,
}: {
  title: string;
  accent?: string;
  kicker?: string;
  tone: ArenaTitleTone;
  // Lutador cuja arte de seleção vira o fundo da tela.
  fighter?: ArenaFighter;
  confetti?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="arena-title-card"
      data-tone={tone === "loading" ? "neutral" : tone}
      className={cn(
        "arena-title absolute inset-0 flex flex-col items-center justify-center gap-6 overflow-hidden p-4 sm:gap-8",
        className,
      )}
    >
      {fighter ? (
        <Image
          src={fighter.banner.path}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="arena-title-art object-cover"
        />
      ) : null}
      <div aria-hidden className="arena-title-backdrop absolute inset-0" />
      <div aria-hidden className="arena-title-stripes absolute inset-y-0 -left-1/4 w-[150%]" />
      <div className="arena-title-head relative flex flex-col items-center gap-2">
        {confetti
          ? CONFETTI.map((piece, index) => (
              <span
                key={index}
                aria-hidden
                className="arena-title-confetti absolute top-1/2 left-1/2"
                style={
                  {
                    "--confetti": piece.color,
                    "--confetti-x": `${piece.x}px`,
                    "--confetti-y": `${piece.y}px`,
                    "--confetti-delay": `${piece.delay}ms`,
                    "--confetti-ms": `${piece.ms}ms`,
                  } as CSSProperties
                }
              />
            ))
          : null}
        {kicker ? (
          <span className="arena-tab relative px-3 py-1 font-arena-title text-[11px] leading-none tracking-widest uppercase sm:text-xs">
            {kicker}
          </span>
        ) : null}
        <h2
          id="arena-overlay-title"
          className="arena-title-text relative flex items-baseline gap-3 font-arena-title text-5xl leading-none uppercase sm:text-7xl"
        >
          <span>{title}</span>
          {accent ? <span className="arena-title-accent">{accent}</span> : null}
        </h2>
        <span aria-hidden className="arena-title-rule relative h-1.5 w-full" />
      </div>
      {children ? <div className="relative w-[min(20rem,100%)]">{children}</div> : null}
    </div>
  );
}

export { ArenaTitleCard };
export type { ArenaTitleTone };
