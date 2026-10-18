"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import type { ArenaRosterEntry } from "@/lib/arena/fighter";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

import { HOLO_EFFECTS } from "./arena-picker-card";

function ArenaPickerSlot({
  label,
  entry,
  active,
  onActivate,
  className,
  ...props
}: ComponentProps<"button"> & {
  label: string;
  entry: ArenaRosterEntry | null;
  active: boolean;
}) {
  return (
    <button
      type="button"
      data-slot="arena-picker-slot"
      data-active={active ? "" : undefined}
      aria-pressed={active}
      aria-label={
        entry
          ? `${label}: ${entry.face.name}`
          : `Escolher ${label.toLocaleLowerCase()}`
      }
      onClick={onActivate}
      className={cn(
        "mx-auto flex w-full max-w-64 flex-col gap-2 rounded-[4%] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:ring-2 data-active:ring-primary",
        className,
      )}
      {...props}
    >
      {entry ? (
        <HoloCard {...entry.face} effects={HOLO_EFFECTS} />
      ) : (
        <span className="flex aspect-63/88 w-full items-center justify-center rounded-[4%] border border-dashed border-border bg-white/50 px-4 text-center text-sm text-foreground-subtle">
          Escolher
        </span>
      )}
      <span className="text-center text-sm font-semibold text-foreground">
        {label}
      </span>
    </button>
  );
}

export { ArenaPickerSlot };
