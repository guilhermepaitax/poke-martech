"use client";

import { PokedexGrid } from "@/components/pokedex-grid/pokedex-grid";
import { CardGridSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { ProfilePeopleDialog } from "./profile-people-dialog";
import { PublicProfileHeader } from "./public-profile-header";
import { TradeProposalDialog } from "./trade-proposal-dialog";
import { usePublicProfileScreen } from "./use-public-profile-screen";

function PublicProfile({ username }: { username: string }) {
  const screen = usePublicProfileScreen(username);

  if (screen.profile.isLoading) {
    return (
      <LoadingScreen label="Carregando perfil" className="flex flex-col gap-8">
        <div className="glass flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-center">
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
  const people = screen.peopleList === "following" ? screen.following : screen.followers;
  const followError = screen.follow.error ?? screen.unfollow.error;

  return (
    <div data-slot="public-profile" className="flex flex-col gap-8">
      <PublicProfileHeader
        person={person}
        followPending={screen.follow.isPending || screen.unfollow.isPending}
        onToggleFollow={() => {
          if (person.isFollowing) screen.unfollow.mutate();
          else screen.follow.mutate();
        }}
        onOpenFollowers={() => screen.setPeopleList("followers")}
        onOpenFollowing={() => screen.setPeopleList("following")}
      />
      {followError ? <p className="text-sm text-destructive">{followError.message}</p> : null}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Coleção</h2>
        <PokedexGrid
          entries={person.pokedex}
          ownedOnly
          markMissing={!person.isSelf}
          onPropose={person.isSelf ? undefined : screen.setTradeEntry}
        />
      </section>
      <ProfilePeopleDialog
        open={screen.peopleList !== null}
        title={screen.peopleList === "following" ? "Seguindo" : "Seguidores"}
        people={people.data ?? []}
        isLoading={screen.peopleList !== null && people.isLoading}
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
