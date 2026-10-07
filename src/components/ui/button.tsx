import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "glow-action bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-foreground hover:bg-secondary/80",
        outline:
          "border border-white/80 bg-white/45 text-foreground backdrop-blur-md hover:bg-white/70",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

interface ButtonProps
  extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {}

function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
