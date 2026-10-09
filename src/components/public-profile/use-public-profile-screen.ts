"use client";

import { useState } from "react";
import {
  useCreateTrade,
  useFollowers,
  useFollowing,
  useFollowMutations,
  useTradableCards,
} from "@/hooks/use-social";
import { usePublicProfile } from "@/hooks/use-opening";
import type { PokedexEntry } from "@/types/catalog";

function usePublicProfileScreen(username: string) {
  const profile = usePublicProfile(username);
  const [peopleList, setPeopleList] = useState<"followers" | "following" | null>(null);
  const [tradeEntry, setTradeEntry] = useState<PokedexEntry | null>(null);
  const followers = useFollowers(username, peopleList === "followers");
  const following = useFollowing(username, peopleList === "following");
  const offers = useTradableCards(tradeEntry !== null);
  const { follow, unfollow } = useFollowMutations(username);
  const propose = useCreateTrade(username);

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
  };
}

export { usePublicProfileScreen };
