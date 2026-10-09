import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const emptyStateVariants = cva("flex flex-col items-center justify-center px-4 text-center", {
  variants: {
    placement: {
      page: "min-h-[calc(100dvh-12rem)] md:min-h-[calc(100dvh-9rem)]",
      fill: "min-h-72 flex-1",
      section: "py-8",
    },
  },
  defaultVariants: { placement: "page" },
});

const screenColumnClass =
  "flex min-h-[calc(100dvh-12rem)] flex-col md:min-h-[calc(100dvh-9rem)]";

interface EmptyStateProps
  extends ComponentProps<"div">, VariantProps<typeof emptyStateVariants> {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  placement,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(emptyStateVariants({ placement }), className)}
      {...props}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-5">
        <div className="relative h-28 w-40" aria-hidden>
          <span className="absolute top-4 left-2 h-24 w-[4.5rem] -rotate-12 rounded-2xl border border-white/80 bg-white/40 shadow-sm" />
          <span className="absolute top-3 left-9 h-24 w-[4.5rem] rotate-[8deg] rounded-2xl border border-white/90 bg-white/60 shadow-sm" />
          <span className="glass absolute top-1 left-[4.25rem] flex h-24 w-[4.5rem] items-center justify-center rounded-2xl">
            <Icon className="size-6 text-primary" />
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold tracking-tight text-foreground">{title}</p>
          <p className="text-sm leading-relaxed text-foreground-subtle">{description}</p>
        </div>
        {action}
      </div>
    </div>
  );
}

export { EmptyState, screenColumnClass };
