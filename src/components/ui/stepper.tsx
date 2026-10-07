import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel: string;
  className?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function Stepper({ value, onValueChange, min = 0, max = 999, step = 1, ariaLabel, className }: StepperProps) {
  return (
    <div data-slot="stepper" className={cn("glass inline-flex w-fit items-center gap-1 self-start rounded-full p-1", className)}>
      <button
        type="button"
        aria-label={`Diminuir ${ariaLabel}`}
        disabled={value <= min}
        onClick={() => onValueChange(clamp(value - step, min, max))}
        className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-12 text-center text-lg font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`Aumentar ${ariaLabel}`}
        disabled={value >= max}
        onClick={() => onValueChange(clamp(value + step, min, max))}
        className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

interface NullableStepperProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  min: number;
  max: number;
  step?: number;
  emptyLabel: string;
  ariaLabel: string;
  className?: string;
}

function NullableStepper({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  emptyLabel,
  ariaLabel,
  className,
}: NullableStepperProps) {
  function decrease() {
    if (value == null) return;
    if (value - step < min) onValueChange(null);
    else onValueChange(Math.min(max, value - step));
  }

  function increase() {
    if (value == null) onValueChange(min);
    else onValueChange(Math.min(max, value + step));
  }

  return (
    <div data-slot="nullable-stepper" className={cn("glass inline-flex w-fit items-center gap-1 self-start rounded-full p-1", className)}>
      <button
        type="button"
        aria-label={`Diminuir ${ariaLabel}`}
        disabled={value == null}
        onClick={decrease}
        className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-16 text-center text-sm font-semibold tabular-nums">{value == null ? emptyLabel : value}</span>
      <button
        type="button"
        aria-label={`Aumentar ${ariaLabel}`}
        disabled={value != null && value >= max}
        onClick={increase}
        className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export { NullableStepper, Stepper };
