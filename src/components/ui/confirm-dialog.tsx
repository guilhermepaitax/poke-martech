"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" />
        <Dialog.Popup className="glass fixed left-1/2 top-1/2 z-50 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6">
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-foreground-subtle">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close className="inline-flex h-10 items-center rounded-full border border-white/80 bg-white/45 px-4 text-sm font-semibold text-foreground backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className={cn(
                "glow-action inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { ConfirmDialog };
