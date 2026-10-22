"use client";

import type { ArenaFighter } from "@/lib/arena/fighter";
import type { ArenaHudState, HudCharge, HudCooldown, HudSlot } from "@/lib/arena/snapshot";
import { ChevronsRight, Flame, HandFist, Hourglass, Sun } from "lucide-react";
import { useState, type CSSProperties } from "react";


const SLOT_KEY: Record<HudSlot, string> = {
  melee: "1",
  fire: "2",
  dash: "Espaço",
};

const ICON_CLASS = "size-5 sm:size-7";

function SlotIcon({ fighter, slot }: { fighter: ArenaFighter; slot: HudSlot }) {
  if (slot === "melee") return <HandFist aria-hidden className={ICON_CLASS} />;
  if (slot === "dash") return <ChevronsRight aria-hidden className={ICON_CLASS} />;
  if (fighter.energy === "grass") return <Sun aria-hidden className={ICON_CLASS} />;
  return <Flame aria-hidden className={ICON_CLASS} />;
}

function slotName(fighter: ArenaFighter, slot: HudSlot) {
  return slot === "dash" ? "Dash" : fighter.attacks[slot].hudName;
}

function ArenaSlot({
  slot,
  fighter,
  cooldown,
  selected,
  charge,
}: {
  slot: HudSlot;
  fighter: ArenaFighter;
  cooldown: HudCooldown;
  selected: boolean;
  charge: HudCharge | null;
}) {
  const [doneCycle, setDoneCycle] = useState(0);
  const cooling = cooldown.remainingMs > 0 && doneCycle !== cooldown.cycle;
  const cooldownStyle = {
    "--cooldown": `${cooldown.durationMs}ms`,
    "--cooldown-delay": `${cooldown.remainingMs - cooldown.durationMs}ms`,
  } as CSSProperties;

  return (
    <div
      data-slot="arena-attack-slot"
      data-selected={selected ? "" : undefined}
      data-cooling={cooling ? "" : undefined}
      data-charge={charge ? charge.level : undefined}
      className="arena-slot relative flex size-12 flex-col items-center justify-center overflow-hidden sm:h-[4.5rem] sm:w-20"
    >
      <span className="arena-slot-unskew flex flex-1 items-center justify-center">
        <SlotIcon fighter={fighter} slot={slot} />
      </span>
      <span className="arena-slot-key flex w-full items-center justify-between gap-1 px-1.5 py-0.5 text-[10px] font-semibold leading-none">
        <span className="arena-slot-unskew hidden truncate uppercase sm:inline">
          {slotName(fighter, slot)}
        </span>
        <span className="arena-slot-unskew mx-auto opacity-80 sm:mx-0">{SLOT_KEY[slot]}</span>
      </span>
      {cooling ? (
        <span key={cooldown.cycle} className="absolute inset-0" style={cooldownStyle}>
          <span
            className="arena-slot-shade absolute inset-0 flex items-center justify-center"
            onAnimationEnd={() => setDoneCycle(cooldown.cycle)}
          >
            <Hourglass aria-hidden className="arena-slot-unskew size-4 text-background/80" />
          </span>
          <span className="arena-slot-scan absolute inset-x-0" />
        </span>
      ) : null}
      {doneCycle === cooldown.cycle && cooldown.cycle > 0 ? (
        <span key={`ready-${cooldown.cycle}`} className="arena-slot-flash absolute inset-0" />
      ) : null}
      {charge ? (
        <span className="absolute inset-x-1 bottom-0.5 h-1 overflow-hidden bg-black/60">
          <span
            key={charge.cycle}
            className="arena-charge-fill block h-full"
            style={{ "--charge-delay": `${-charge.heldMs}ms` } as CSSProperties}
          />
        </span>
      ) : null}
      {charge?.level === 2 ? (
        <span className="absolute top-1 right-1 rounded-sm bg-energy-psychic px-1 text-[9px] font-bold leading-3 text-background">
          MÁX
        </span>
      ) : null}
    </div>
  );
}

function ArenaAttackBar({ fighter, hud }: { fighter: ArenaFighter; hud: ArenaHudState | null }) {
  if (!hud) return null;
  const slots: HudSlot[] = ["melee", "fire", "dash"];

  return (
    <div
      data-slot="arena-attack-bar"
      className="pointer-events-none absolute inset-x-0 bottom-3 z-[5] flex justify-center px-4 sm:bottom-5"
    >
      <div className="relative flex items-end gap-3 px-6 pb-3 sm:gap-4 sm:px-10">
        <div
          aria-hidden
          className="arena-bar-strip absolute inset-x-0 bottom-0 h-7 translate-x-2 sm:h-9"
        />
        {slots.map((slot) => (
          <div key={slot} className={slot === "dash" ? "relative ml-2 sm:ml-4" : "relative"}>
            <ArenaSlot
              slot={slot}
              fighter={fighter}
              cooldown={hud.cooldowns[slot]}
              selected={slot === hud.kind}
              charge={slot === hud.kind ? hud.charge : null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export { ArenaAttackBar };
