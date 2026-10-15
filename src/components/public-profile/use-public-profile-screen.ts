"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateTrade,
  useFollowers,
  useFollowing,
  useFollowMutations,
  useTradableCards,
} from "@/hooks/use-social";
import { usePublicProfile } from "@/hooks/use-opening";
import type { PokedexEntry } from "@/types/catalog";
import { useShareProfile } from "./use-share-profile";

function usePublicProfileScreen(username: string, inviteFollow: boolean) {
  const router = useRouter();
  const profile = usePublicProfile(username);
  const [peopleList, setPeopleList] = useState<"followers" | "following" | null>(null);
  const [tradeEntry, setTradeEntry] = useState<PokedexEntry | null>(null);
  const [dismissedInvite, setDismissedInvite] = useState(false);
  const followers = useFollowers(username, peopleList === "followers");
  const following = useFollowing(username, peopleList === "following");
  const offers = useTradableCards(tradeEntry !== null);
  const { follow, unfollow } = useFollowMutations(username);
  const propose = useCreateTrade(username);
  const share = useShareProfile(username);

  function dismissInvite() {
    setDismissedInvite(true);
    follow.reset();
    router.replace(`/u/${username}`, { scroll: false });
  }

  return {
    profile,
    peopleList,
    setPeopleList,
    followers,
    following,
    tradeEntry,
    setTradeEntry,
    offers,
    follow,
    unfollow,
    propose,
    share,
    inviteOpen: inviteFollow && !dismissedInvite,
    dismissInvite,
  };
}

export { usePublicProfileScreen };
