import { Button } from "@/components/ui/button";
import { UserInitials } from "@/components/ui/user-initials";
import type { PublicProfile } from "@/types/catalog";
import { Check, Share2 } from "lucide-react";

interface ProfileShareAction {
  copied: boolean;
  pending: boolean;
  error: string | null;
  onShare: () => void;
}

interface PublicProfileHeaderProps {
  person: PublicProfile;
  followPending: boolean;
  share: ProfileShareAction | null;
  onToggleFollow: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
}

function PublicProfileHeader({
  person,
  followPending,
  share,
  onToggleFollow,
  onOpenFollowers,
  onOpenFollowing,
}: PublicProfileHeaderProps) {
  return (
    <div
      data-slot="public-profile-header"
      className="glass flex items-start gap-4 rounded-3xl p-5"
    >
      <UserInitials
        name={person.name}
        username={person.username}
        image={person.image}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {person.name}
          </h1>
          <p className="text-foreground-subtle">@{person.username}</p>
          {person.bio ? (
            <p className="mt-2 max-w-prose text-sm">{person.bio}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenFollowers}
              className="rounded-full bg-white/50 px-3 py-1.5 text-sm text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <span className="font-semibold text-foreground">
                {person.followerCount}
              </span>{" "}
              {person.followerCount === 1 ? "seguidor" : "seguidores"}
            </button>
            <button
              type="button"
              onClick={onOpenFollowing}
              className="rounded-full bg-white/50 px-3 py-1.5 text-sm text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <span className="font-semibold text-foreground">
                {person.followingCount}
              </span>{" "}
              seguindo
            </button>
          </div>
        </div>
        {share ? (
          <div className="flex shrink-0 flex-col items-end gap-1 self-end sm:self-center">
            <Button
              variant="outline"
              disabled={share.pending}
              aria-live="polite"
              aria-label={share.copied ? "Link copiado" : "Compartilhar perfil"}
              onClick={share.onShare}
            >
              {share.copied ? (
                <Check className="size-4" />
              ) : (
                <Share2 className="size-4" />
              )}
              {share.copied ? "Link copiado" : "Compartilhar"}
            </Button>
            {share.error ? (
              <p className="text-xs text-destructive">{share.error}</p>
            ) : null}
          </div>
        ) : (
          <Button
            className="shrink-0 self-end sm:self-center"
            variant={person.isFollowing ? "outline" : "default"}
            disabled={followPending}
            onClick={onToggleFollow}
          >
            {person.isFollowing ? "Deixar de seguir" : "Seguir"}
          </Button>
        )}
      </div>
    </div>
  );
}

export { PublicProfileHeader };
