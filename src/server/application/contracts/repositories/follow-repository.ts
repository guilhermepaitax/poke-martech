import type { PageRequest, PageSlice } from "@/server/application/page";
import type { ProfileLink } from "@/types/catalog";

interface FollowRepository {
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  create(followerId: string, followingId: string): Promise<void>;
  delete(followerId: string, followingId: string): Promise<void>;
  counts(userId: string): Promise<{ followers: number; following: number }>;
  listFollowers(userId: string, request: PageRequest): Promise<PageSlice<ProfileLink>>;
  listFollowing(userId: string, request: PageRequest): Promise<PageSlice<ProfileLink>>;
}

export type { FollowRepository };
