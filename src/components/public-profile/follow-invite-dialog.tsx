"use client";

import { Button } from "@/components/ui/button";
import { UserInitials } from "@/components/ui/user-initials";
import type { PublicProfile } from "@/types/catalog";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

interface FollowInviteDialogProps {
  person: PublicProfile;
  open: boolean;
  pending: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onFollow: () => void;
}

function FollowInviteDialog({
  person,
  open,
  pending,
  error,
  onOpenChange,
  onFollow,
}: FollowInviteDialogProps) {
  const followers =
    person.followerCount === 1 ? "1 seguidor" : `${person.followerCount} seguidores`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" />
        <Dialog.Popup
          data-slot="follow-invite-dialog"
          className="glass bg-white/90! fixed top-1/2 left-1/2 z-50 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 outline-none"
        >
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {person.isFollowing ? person.name : `Seguir ${person.name}`}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fechar"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-foreground-subtle">
            {person.isFollowing
              ? "Você já segue este treinador."
              : person.bio || `Acompanhe a coleção de @${person.username}.`}
          </Dialog.Description>
          <div className="mt-5 flex items-center gap-3">
            <UserInitials name={person.name} username={person.username} image={person.image} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{person.name}</p>
              <p className="truncate text-sm text-foreground-subtle">@{person.username}</p>
              <p className="mt-1 text-sm text-foreground-subtle">{followers}</p>
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          <div className="mt-6 flex justify-end gap-2">
            {person.isFollowing ? (
              <Button onClick={() => onOpenChange(false)}>Ver perfil</Button>
            ) : (
              <>
                <Dialog.Close className="inline-flex h-10 items-center rounded-full border border-white/80 bg-white/45 px-4 text-sm font-semibold text-foreground backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
                  Agora não
                </Dialog.Close>
                <Button disabled={pending} onClick={onFollow}>
                  {pending ? "Aguarde" : "Seguir"}
                </Button>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { FollowInviteDialog };
