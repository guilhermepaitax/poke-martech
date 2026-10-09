import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ComponentProps } from "react";

interface UserInitialsProps extends ComponentProps<"span"> {
  name: string;
  username: string;
  image?: string | null;
}

function initials(name: string, username: string) {
  const letters = Array.from(name).filter((char) => /\p{L}|\p{N}/u.test(char));
  if (letters.length >= 2) return `${letters[0]}${letters[1]}`.toUpperCase();
  if (letters.length === 1) return letters[0].toUpperCase();
  return Array.from(username)[0]?.toUpperCase() ?? "?";
}

function UserInitials({ name, username, image, className, ...props }: UserInitialsProps) {
  if (image) {
    return (
      <span
        data-slot="user-initials"
        className={cn("relative inline-flex size-16 shrink-0 overflow-hidden rounded-full", className)}
        {...props}
      >
        <Image src={image} alt="" fill className="object-cover" />
      </span>
    );
  }

  return (
    <span
      data-slot="user-initials"
      className={cn(
        "inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary",
        className,
      )}
      {...props}
    >
      {initials(name, username)}
    </span>
  );
}

export { UserInitials };
export type { UserInitialsProps };
