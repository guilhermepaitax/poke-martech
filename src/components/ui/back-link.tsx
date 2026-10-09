"use client";

import { useReturnTo } from "@/hooks/use-list-location";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonVariants } from "./button";

interface BackLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
  fallback: string;
}

function BackLink({ fallback, className, ...props }: BackLinkProps) {
  const href = useReturnTo(fallback);

  return (
    <Link
      href={href}
      data-slot="back-link"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit", className)}
      {...props}
    >
      <ArrowLeft className="size-4" />
      Voltar
    </Link>
  );
}

export { BackLink };
