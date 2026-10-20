"use client";

import { PokedexGrid } from "@/components/pokedex-grid/pokedex-grid";
import {
  CardGridSkeleton,
  LoadingScreen,
  Skeleton,
} from "@/components/ui/skeleton";
import { FollowInviteDialog } from "./follow-invite-dialog";
import { ProfilePeopleDialog } from "./profile-people-dialog";
import { PublicProfileHeader } from "./public-profile-header";
import { TradeProposalDialog } from "./trade-proposal-dialog";
import { usePublicProfileScreen } from "./use-public-profile-screen";

function PublicProfile({
  username,
  inviteFollow,
}: {
  username: string;
  inviteFollow: boolean;
}) {
  const screen = usePublicProfileScreen(username, inviteFollow);

  if (screen.profile.isLoading || screen.cards.isLoading) {
    return (
      <LoadingScreen label="Carregando perfil" className="flex flex-col gap-8">
        <div className="glass flex items-start gap-4 rounded-3xl p-5">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-28" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <Skeleton className="h-6 w-24" />
        <CardGridSkeleton />
      </LoadingScreen>
    );
  }
  if (screen.profile.isError || !screen.profile.data) {
    return <p className="text-destructive">Treinador não encontrado.</p>;
  }

  const person = screen.profile.data;
  const cardPages = screen.cards.data?.pages ?? [];
  const people =
    screen.peopleList === "following" ? screen.following : screen.followers;
  const inviteVisible = screen.inviteOpen && !person.isSelf;
  const followError = screen.follow.error ?? screen.unfollow.error;

  return (
    <div data-slot="public-profile" className="flex flex-col gap-8">
      <PublicProfileHeader
        person={person}
        share={
          person.isSelf
            ? {
                copied: screen.share.copied,
                pending: screen.share.pending,
                error: screen.share.error,
                onShare: () => screen.share.share(person.name),
              }
            : null
        }
        followPending={screen.follow.isPending || screen.unfollow.isPending}
        onToggleFollow={() => {
          if (person.isFollowing) screen.unfollow.mutate();
          else screen.follow.mutate();
        }}
        onOpenFollowers={() => screen.setPeopleList("followers")}
        onOpenFollowing={() => screen.setPeopleList("following")}
      />
      {followError && !inviteVisible ? (
        <p className="text-sm text-destructive">{followError.message}</p>
      ) : null}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Coleção</h2>
        <PokedexGrid
          filters={screen.cardFilters}
          entries={cardPages.flatMap((page) => page.items)}
          owned={cardPages[0]?.total ?? 0}
          total={cardPages[0]?.total ?? 0}
          hasMore={screen.cards.hasNextPage}
          isFetchingMore={screen.cards.isFetchingNextPage}
          onLoadMore={() => void screen.cards.fetchNextPage()}
          ownedOnly
          markMissing={!person.isSelf}
          onPropose={person.isSelf ? undefined : screen.setTradeEntry}
        />
      </section>
      <FollowInviteDialog
        person={person}
        open={inviteVisible}
        pending={screen.follow.isPending}
        error={screen.follow.error?.message ?? null}
        onOpenChange={(open) => {
          if (!open) screen.dismissInvite();
        }}
        onFollow={() => {
          screen.follow.mutate(undefined, {
            onSuccess: () => screen.dismissInvite(),
          });
        }}
      />
      <ProfilePeopleDialog
        open={screen.peopleList !== null}
        title={screen.peopleList === "following" ? "Seguindo" : "Seguidores"}
        people={people.data?.pages.flatMap((page) => page.items) ?? []}
        isLoading={screen.peopleList !== null && people.isLoading}
        hasMore={people.hasNextPage}
        isFetchingMore={people.isFetchingNextPage}
        onLoadMore={() => void people.fetchNextPage()}
        onOpenChange={(open) => {
          if (!open) screen.setPeopleList(null);
        }}
      />
      <TradeProposalDialog
        entry={screen.tradeEntry}
        offers={screen.offers.data ?? []}
        isLoading={screen.tradeEntry !== null && screen.offers.isLoading}
        pending={screen.propose.isPending}
        error={screen.propose.error?.message ?? null}
        onOpenChange={(open) => {
          if (!open) {
            screen.setTradeEntry(null);
            screen.propose.reset();
          }
        }}
        onConfirm={(offeredCardId) => {
          if (!screen.tradeEntry) return;
          screen.propose.mutate(
            { requestedCardId: screen.tradeEntry.id, offeredCardId },
            { onSuccess: () => screen.setTradeEntry(null) },
          );
        }}
      />
    </div>
  );
}

export { PublicProfile };
