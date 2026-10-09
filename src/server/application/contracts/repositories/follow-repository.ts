import type { ProfileLink } from "@/types/catalog";

interface FollowRepository {
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  create(followerId: string, followingId: string): Promise<void>;
  delete(followerId: string, followingId: string): Promise<void>;
  counts(userId: string): Promise<{ followers: number; following: number }>;
  listFollowers(userId: string): Promise<ProfileLink[]>;
  listFollowing(userId: string): Promise<ProfileLink[]>;
}

export type { FollowRepository };
