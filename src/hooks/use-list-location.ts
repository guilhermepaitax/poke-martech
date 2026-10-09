"use client";

import { safeReturnPath } from "@/lib/return-path";
import { usePathname, useSearchParams } from "next/navigation";

function useListLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function useReturnTo(fallback: string) {
  const searchParams = useSearchParams();
  return safeReturnPath(searchParams.get("voltar"), fallback);
}

export { useListLocation, useReturnTo };
