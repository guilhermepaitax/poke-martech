import { and, asc, eq, or, sql } from "drizzle-orm";
import { sliceRows, type PageRequest, type PageSlice } from "@/server/application/page";
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
    const [row] = await db
      .select({
        followers: sql<number>`count(*) filter (where ${follows.followingId} = ${userId})::int`,
        following: sql<number>`count(*) filter (where ${follows.followerId} = ${userId})::int`,
      })
      .from(follows)
      .where(or(eq(follows.followingId, userId), eq(follows.followerId, userId)));
    return { followers: row?.followers ?? 0, following: row?.following ?? 0 };
  }

  async listFollowers(userId: string, request: PageRequest): Promise<PageSlice<ProfileLink>> {
    const rows = await db
      .select({ username: user.username, name: user.name })
      .from(follows)
      .innerJoin(user, eq(user.id, follows.followerId))
      .where(eq(follows.followingId, userId))
      .orderBy(asc(user.username))
      .limit(request.limit + 1)
      .offset(request.cursor);
    return sliceRows(rows, request);
  }

  async listFollowing(userId: string, request: PageRequest): Promise<PageSlice<ProfileLink>> {
    const rows = await db
      .select({ username: user.username, name: user.name })
      .from(follows)
      .innerJoin(user, eq(user.id, follows.followingId))
      .where(eq(follows.followerId, userId))
      .orderBy(asc(user.username))
      .limit(request.limit + 1)
      .offset(request.cursor);
    return sliceRows(rows, request);
  }
}

export { DrizzleFollowRepository };
