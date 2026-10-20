"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  return useInfiniteQuery({
    queryKey: socialKeys.followers(username),
    queryFn: ({ pageParam }) => fetchFollowers(username, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
  });
}

function useFollowing(username: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: socialKeys.following(username),
    queryFn: ({ pageParam }) => fetchFollowing(username, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
  });
}

function useFollowMutations(username: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: publicProfileKeys.detail(username) }),
      queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      queryClient.invalidateQueries({ queryKey: socialKeys.all }),
    ]);
  const follow = useMutation({ mutationFn: () => followUser(username), onSuccess: invalidate });
  const unfollow = useMutation({ mutationFn: () => unfollowUser(username), onSuccess: invalidate });
  return { follow, unfollow };
}

function useTrades(box: "incoming" | "outgoing") {
  return useInfiniteQuery({
    queryKey: tradeKeys.list(box),
    queryFn: ({ pageParam }) => fetchTrades(box, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
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
  const invalidateProposals = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      queryClient.invalidateQueries({ queryKey: tradeKeys.all }),
    ]);
  const invalidateOwnership = () =>
    Promise.all([
      invalidateProposals(),
      queryClient.invalidateQueries({ queryKey: pokedexKeys.all }),
    ]);
  const accept = useMutation({ mutationFn: acceptTrade, onSuccess: invalidateOwnership });
  const reject = useMutation({ mutationFn: rejectTrade, onSuccess: invalidateProposals });
  const cancel = useMutation({ mutationFn: cancelTrade, onSuccess: invalidateProposals });
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
