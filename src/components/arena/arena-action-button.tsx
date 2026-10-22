import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

function ArenaActionButton({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" }) {
  if (variant === "secondary") {
    return (
      <button
        type="button"
        data-slot="arena-action-button"
        className={cn(
          "arena-ghost flex h-11 w-full items-center justify-center gap-2 font-arena-title text-sm uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arena-cta)",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <div className="arena-cta-shadow">
      <button
        type="button"
        data-slot="arena-action-button"
        className={cn(
          "arena-cta flex h-13 w-full items-center justify-center gap-2 font-arena-title text-xl uppercase",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { ArenaActionButton };
