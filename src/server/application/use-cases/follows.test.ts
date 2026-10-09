import { describe, expect, it } from "vitest";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import { FollowUser } from "@/server/application/use-cases/follow-user";
import type { ProfileLink } from "@/types/catalog";

const ash = { id: "user-1", role: "user" };

class MemoryProfiles implements ProfileRepository {
  people = [
    { id: "user-1", username: "ash", name: "Ash", image: null, bio: "" },
    { id: "user-2", username: "misty", name: "Misty", image: null, bio: "" },
  ];

  async findByUserId() {
    return null;
  }

  async findPublicByUsername(username: string) {
    return this.people.find((person) => person.username === username) ?? null;
  }
}

class MemoryFollows implements FollowRepository {
  rows: { followerId: string; followingId: string }[] = [];

  async isFollowing(followerId: string, followingId: string) {
    return this.rows.some((row) => row.followerId === followerId && row.followingId === followingId);
  }

  async create(followerId: string, followingId: string) {
    this.rows.push({ followerId, followingId });
  }

  async delete(followerId: string, followingId: string) {
    this.rows = this.rows.filter(
      (row) => row.followerId !== followerId || row.followingId !== followingId,
    );
  }

  async counts() {
    return { followers: 0, following: 0 };
  }

  async listFollowers(): Promise<ProfileLink[]> {
    return [];
  }

  async listFollowing(): Promise<ProfileLink[]> {
    return [];
  }
}

describe("FollowUser", () => {
  it("rejects a follow of yourself", async () => {
    const follows = new MemoryFollows();
    const result = await new FollowUser(new MemoryProfiles(), follows).execute({ username: "ash" }, ash);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    expect(follows.rows).toHaveLength(0);
  });

  it("rejects a duplicate follow", async () => {
    const follows = new MemoryFollows();
    const useCase = new FollowUser(new MemoryProfiles(), follows);
    const first = await useCase.execute({ username: "misty" }, ash);
    const second = await useCase.execute({ username: "misty" }, ash);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error.code).toBe("CONFLICT");
    expect(follows.rows).toHaveLength(1);
  });
});
