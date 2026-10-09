import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";

const landingLinkVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-full font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-gold focus-visible:ring-offset-2 focus-visible:ring-offset-landing-ink",
  {
    variants: {
      tone: {
        gold: "bg-landing-gold text-landing-ink hover:bg-landing-gold/90",
        quiet:
          "border border-landing-paper/45 text-landing-paper hover:bg-landing-paper/10",
      },
      size: {
        nav: "h-10 px-4 text-sm",
        hero: "h-12 px-6 text-sm",
      },
    },
    defaultVariants: {
      tone: "gold",
      size: "hero",
    },
  },
);

interface LandingLinkProps
  extends ComponentProps<typeof Link>,
    VariantProps<typeof landingLinkVariants> {}

function LandingLink({
  className,
  tone,
  size,
  ...props
}: LandingLinkProps) {
  return (
    <Link
      data-slot="landing-link"
      className={cn(landingLinkVariants({ tone, size, className }))}
      {...props}
    />
  );
}

export { LandingLink };
