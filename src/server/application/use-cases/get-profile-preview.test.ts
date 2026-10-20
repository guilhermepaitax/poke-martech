import { describe, expect, it } from "vitest";
import type { FollowRepository } from "@/server/application/contracts/repositories/follow-repository";
import type { ProfileRepository } from "@/server/application/contracts/repositories/profile-repository";
import { GetProfilePreview } from "@/server/application/use-cases/get-profile-preview";

class MemoryProfiles implements ProfileRepository {
  async findByUserId() {
    return null;
  }

  async findPublicByUsername(username: string) {
    if (username !== "misty") return null;
    return {
      id: "user-2",
      username: "misty",
      name: "Misty",
      image: "https://cdn.example/misty.png",
      bio: "Ginásio de Cerulean",
    };
  }
}

class MemoryFollows implements FollowRepository {
  async isFollowing() {
    return false;
  }

  async create() {}

  async delete() {}

  async counts() {
    return { followers: 4, following: 2 };
  }

  async listFollowers() {
    return { items: [], hasMore: false };
  }

  async listFollowing() {
    return { items: [], hasMore: false };
  }
}

describe("GetProfilePreview", () => {
  it("returns public profile fields for a share preview", async () => {
    const result = await new GetProfilePreview(new MemoryProfiles(), new MemoryFollows()).execute({
      username: "Misty",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      username: "misty",
      name: "Misty",
      image: "https://cdn.example/misty.png",
      bio: "Ginásio de Cerulean",
      followerCount: 4,
      followingCount: 2,
    });
  });

  it("hides unknown trainers", async () => {
    const result = await new GetProfilePreview(new MemoryProfiles(), new MemoryFollows()).execute({
      username: "brock",
    });
    expect(result.ok).toBe(false);
  });
});
