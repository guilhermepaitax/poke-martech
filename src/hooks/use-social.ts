"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/hooks/use-profile";
import { pokedexKeys } from "@/hooks/use-pokedex";
import { publicProfileKeys } from "@/hooks/use-opening";
import {
  acceptTrade,
  cancelTrade,
  createTrade,
  fetchFollowers,
  fetchFollowing,
  fetchTradableCards,
  fetchTrades,
  followUser,
  rejectTrade,
  unfollowUser,
} from "@/services/social";

const socialKeys = {
  all: ["social"] as const,
  followers: (username: string) => [...socialKeys.all, "followers", username] as const,
  following: (username: string) => [...socialKeys.all, "following", username] as const,
};

const tradeKeys = {
  all: ["trades"] as const,
  list: (box: "incoming" | "outgoing") => [...tradeKeys.all, box] as const,
  offers: () => [...tradeKeys.all, "offers"] as const,
};

function useFollowers(username: string, enabled: boolean) {
  return useQuery({
    queryKey: socialKeys.followers(username),
    queryFn: () => fetchFollowers(username),
    enabled,
  });
}

function useFollowing(username: string, enabled: boolean) {
  return useQuery({
    queryKey: socialKeys.following(username),
    queryFn: () => fetchFollowing(username),
    enabled,
  });
}

function useFollowMutations(username: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: publicProfileKeys.all }),
      queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      queryClient.invalidateQueries({ queryKey: socialKeys.all }),
    ]);
  const follow = useMutation({ mutationFn: () => followUser(username), onSuccess: invalidate });
  const unfollow = useMutation({ mutationFn: () => unfollowUser(username), onSuccess: invalidate });
  return { follow, unfollow };
}

function useTrades(box: "incoming" | "outgoing") {
  return useQuery({ queryKey: tradeKeys.list(box), queryFn: () => fetchTrades(box) });
}

function useTradableCards(enabled: boolean) {
  return useQuery({ queryKey: tradeKeys.offers(), queryFn: fetchTradableCards, enabled });
}

function useCreateTrade(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestedCardId: string; offeredCardId: string }) =>
      createTrade({ targetUsername: username, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tradeKeys.all }),
  });
}

function useTradeActions() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      queryClient.invalidateQueries({ queryKey: publicProfileKeys.all }),
      queryClient.invalidateQueries({ queryKey: tradeKeys.all }),
      queryClient.invalidateQueries({ queryKey: pokedexKeys.all }),
    ]);
  const accept = useMutation({ mutationFn: acceptTrade, onSuccess: invalidate });
  const reject = useMutation({ mutationFn: rejectTrade, onSuccess: invalidate });
  const cancel = useMutation({ mutationFn: cancelTrade, onSuccess: invalidate });
  return { accept, reject, cancel };
}

export {
  socialKeys,
  tradeKeys,
  useCreateTrade,
  useFollowers,
  useFollowing,
  useFollowMutations,
  useTradableCards,
  useTradeActions,
  useTrades,
};
