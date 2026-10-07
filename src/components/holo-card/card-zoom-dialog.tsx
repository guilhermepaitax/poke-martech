"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

function CardZoomDialog({
  open,
  onOpenChange,
  title = "Carta ampliada",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" />
        <Dialog.Popup
          data-slot="card-zoom-dialog"
          className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100%-2rem),calc((100dvh-7rem)*63/88))] -translate-x-1/2 -translate-y-1/2 outline-none"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Close
            aria-label="Fechar"
            className="absolute -top-12 right-0 flex size-10 items-center justify-center rounded-full bg-white/80 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </Dialog.Close>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { CardZoomDialog };
