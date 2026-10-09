import { and, asc, eq, sql } from "drizzle-orm";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { follows, user } from "@/server/infrastructure/db/drizzle/schema";
import type { ProfileLink } from "@/types/catalog";

class DrizzleFollowRepository implements FollowRepository {
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const rows = await db
      .select({ followerId: follows.followerId })
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .limit(1);
    return rows.length > 0;
  }

  async create(followerId: string, followingId: string): Promise<void> {
    await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
  }

  async delete(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async counts(userId: string): Promise<{ followers: number; following: number }> {
    const [followers] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, userId));
    const [following] = await db
      .select({ value: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return { followers: followers?.value ?? 0, following: following?.value ?? 0 };
  }

  async listFollowers(userId: string): Promise<ProfileLink[]> {
    return db
      .select({ username: user.username, name: user.name })
      .from(follows)
      .innerJoin(user, eq(user.id, follows.followerId))
      .where(eq(follows.followingId, userId))
      .orderBy(asc(user.username));
  }

  async listFollowing(userId: string): Promise<ProfileLink[]> {
    return db
      .select({ username: user.username, name: user.name })
      .from(follows)
      .innerJoin(user, eq(user.id, follows.followingId))
      .where(eq(follows.followerId, userId))
      .orderBy(asc(user.username));
  }
}

export { DrizzleFollowRepository };
