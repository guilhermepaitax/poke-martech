import { Button } from "@/components/ui/button";
import { UserInitials } from "@/components/ui/user-initials";
import type { PublicProfile } from "@/types/catalog";

interface PublicProfileHeaderProps {
  person: PublicProfile;
  followPending: boolean;
  onToggleFollow: () => void;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
}

function PublicProfileHeader({
  person,
  followPending,
  onToggleFollow,
  onOpenFollowers,
  onOpenFollowing,
}: PublicProfileHeaderProps) {
  return (
    <div
      data-slot="public-profile-header"
      className="glass flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-center"
    >
      <UserInitials
        name={person.name}
        username={person.username}
        image={person.image}
      />
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold tracking-tight">{person.name}</h1>
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
      {person.isSelf ? null : (
        <Button
          variant={person.isFollowing ? "outline" : "default"}
          disabled={followPending}
          onClick={onToggleFollow}
        >
          {person.isFollowing ? "Deixar de seguir" : "Seguir"}
        </Button>
      )}
    </div>
  );
}

export { PublicProfileHeader };
