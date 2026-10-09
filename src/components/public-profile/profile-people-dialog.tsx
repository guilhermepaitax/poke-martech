"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { UserInitials } from "@/components/ui/user-initials";
import type { ProfileLink } from "@/types/catalog";
import Link from "next/link";

interface ProfilePeopleDialogProps {
  open: boolean;
  title: string;
  people: ProfileLink[];
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProfilePeopleDialog({
  open,
  title,
  people,
  isLoading,
  onOpenChange,
}: ProfilePeopleDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" />
        <Dialog.Popup className="glass fixed top-1/2 left-1/2 z-50 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6">
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          <div className="mt-4">
            {isLoading ? (
              <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-2">
                <span className="sr-only">Carregando</span>
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {!isLoading && people.length === 0 ? (
              <EmptyState
                placement="section"
                icon={Users}
                title="Ninguém por aqui"
                description={
                  title === "Seguindo"
                    ? "Este treinador ainda não segue ninguém."
                    : "Este treinador ainda não tem seguidores."
                }
              />
            ) : null}
            {people.length > 0 ? (
              <ul className="flex max-h-80 flex-col gap-1 overflow-auto">
                {people.map((person) => (
                  <li key={person.username}>
                    <Link
                      href={`/u/${person.username}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <UserInitials
                        name={person.name}
                        username={person.username}
                        className="size-10 text-sm"
                      />
                      <span>
                        <span className="block font-semibold text-foreground">{person.name}</span>
                        <span className="text-sm text-foreground-subtle">@{person.username}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { ProfilePeopleDialog };
