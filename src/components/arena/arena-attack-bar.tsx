"use client";

import type { ArenaFighter } from "@/lib/arena/fighter";
import type {
  ArenaDevice,
  ArenaHudState,
  HudCharge,
  HudCooldown,
  HudGuard,
  HudSlot,
  HudSpecial,
} from "@/lib/arena/snapshot";
import { ChevronsRight, HandFist, Hourglass, Shield, Sparkles } from "lucide-react";
import { useState, type CSSProperties } from "react";

import { fighterAppearance } from "./fighter-appearance";

const SLOT_KEY: Record<ArenaDevice, Record<HudSlot, string>> = {
  pointer: {
    melee: "1",
    fire: "2",
    special: "3",
    dash: "ESPAÇO",
    defend: "SHIFT",
  },
  pad: {
    melee: "A",
    fire: "X",
    special: "Y",
    dash: "B",
    defend: "LB",
  },
};

const SLOT_NAME: Partial<Record<HudSlot, string>> = {
  dash: "Dash",
  defend: "Defesa",
};

const ICON_CLASS = "size-5 sm:size-7";

function SlotIcon({ fighter, slot }: { fighter: ArenaFighter; slot: HudSlot }) {
  if (slot === "melee") return <HandFist aria-hidden className={ICON_CLASS} />;
  if (slot === "dash") return <ChevronsRight aria-hidden className={ICON_CLASS} />;
  if (slot === "defend") return <Shield aria-hidden className={ICON_CLASS} />;
  if (slot === "special") return <Sparkles aria-hidden className={ICON_CLASS} />;
  const RangedIcon = fighterAppearance(fighter.energy).rangedIcon;
  return <RangedIcon aria-hidden className={ICON_CLASS} />;
}

function slotName(fighter: ArenaFighter, slot: HudSlot) {
  if (slot === "dash" || slot === "defend") return SLOT_NAME[slot];
  return fighter.attacks[slot].hudName;
}

function ArenaSlot({
  slot,
  device,
  fighter,
  cooldown,
  selected,
  charge,
  guard,
  special,
}: {
  slot: HudSlot;
  device: ArenaDevice;
  fighter: ArenaFighter;
  cooldown: HudCooldown;
  selected: boolean;
  charge: HudCharge | null;
  guard: HudGuard | null;
  special: HudSpecial | null;
}) {
  const [doneCycle, setDoneCycle] = useState(0);
  const cooling = cooldown.remainingMs > 0 && doneCycle !== cooldown.cycle;
  const cooldownStyle = {
    "--cooldown": `${cooldown.durationMs}ms`,
    "--cooldown-delay": `${cooldown.remainingMs - cooldown.durationMs}ms`,
  } as CSSProperties;

  return (
    <div className="relative">
      <div
        data-slot="arena-attack-slot"
        data-selected={selected ? "" : undefined}
        data-cooling={cooling ? "" : undefined}
        data-charge={charge ? charge.level : undefined}
        data-defending={guard?.defending ? "" : undefined}
        data-special-ready={special?.ready ? "" : undefined}
        data-special-empty={special && !special.ready && !selected ? "" : undefined}
        className="arena-slot relative flex size-12 flex-col items-center justify-center overflow-hidden sm:h-[4.5rem] sm:w-24"
      >
        <span className="arena-slot-keycap absolute top-0 left-0 hidden px-1.5 text-[9px] font-bold leading-4 sm:block">
          <span className="arena-slot-unskew block">{SLOT_KEY[device][slot]}</span>
        </span>
        <span className="arena-slot-unskew flex flex-1 items-center justify-center">
          <SlotIcon fighter={fighter} slot={slot} />
        </span>
        <span className="arena-slot-key flex w-full items-center justify-center px-1 py-1 text-[10px] font-semibold leading-none">
          <span className="arena-slot-unskew hidden whitespace-nowrap uppercase tracking-wide sm:inline">
            {slotName(fighter, slot)}
          </span>
          <span className="arena-slot-unskew opacity-80 sm:hidden">{SLOT_KEY[device][slot]}</span>
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
        {special?.ready ? (
          <span className="absolute top-1 right-1 rounded-sm bg-[#5cf2ff] px-1 text-[9px] font-bold leading-3 text-background">
            PRONTO
          </span>
        ) : null}
        {charge?.level === 2 ? (
          <span className="absolute top-1 right-1 rounded-sm bg-energy-psychic px-1 text-[9px] font-bold leading-3 text-background">
            MÁX
          </span>
        ) : null}
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-0 -skew-x-12">
        {charge ? (
          <span
            data-charge={charge.level}
            className="absolute inset-x-1 top-full mt-1.5 h-1 overflow-hidden bg-black/60"
          >
            <span
              key={charge.cycle}
              className="arena-charge-fill block h-full"
              style={{ "--charge-delay": `${-charge.heldMs}ms` } as CSSProperties}
            />
          </span>
        ) : null}
        {special ? (
          <span className="absolute inset-x-1 top-full mt-1.5 h-1 overflow-hidden bg-black/60">
            <span
              className="arena-special-fill block h-full"
              style={{ transform: `scaleX(${special.ratio})` }}
            />
          </span>
        ) : null}
        {guard ? (
          <span className="absolute inset-x-1 top-full mt-1.5 h-1 overflow-hidden bg-black/60">
            <span
              className="arena-guard-fill block h-full"
              style={{ transform: `scaleX(${guard.ratio})` }}
            />
          </span>
        ) : null}
      </span>
    </div>
  );
}

function ArenaAttackBar({ fighter, hud }: { fighter: ArenaFighter; hud: ArenaHudState | null }) {
  if (!hud) return null;
  const slots: HudSlot[] = ["melee", "fire", "special", "dash", "defend"];

  return (
    <div
      data-slot="arena-attack-bar"
      className="pointer-events-none absolute inset-x-0 bottom-3 z-[5] flex justify-center px-4 sm:bottom-5"
    >
      <div className="relative flex items-end gap-3 px-6 pb-3 sm:gap-4 sm:px-10">
        <div aria-hidden className="arena-bar-strip absolute inset-x-0 bottom-0 h-7 sm:h-9" />
        {slots.map((slot) => (
          <ArenaSlot
            key={slot}
            slot={slot}
            device={hud.device}
            fighter={fighter}
            cooldown={hud.cooldowns[slot]}
            selected={slot === hud.kind}
            charge={slot === hud.kind ? hud.charge : null}
            guard={slot === "defend" ? hud.guard : null}
            special={slot === "special" ? hud.special : null}
          />
        ))}
      </div>
    </div>
  );
}

export { ArenaAttackBar };
