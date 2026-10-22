import { describe, expect, it } from "vitest";
import type { ArenaDifficulty } from "@/lib/arena/cpu";
import type {
  ArenaDefeatResult,
  ArenaMatchRepository,
  ArenaWinClaim,
  ArenaWinClaimResult,
} from "@/server/application/contracts/repositories/arena-match-repository";
import { ClaimArenaWin } from "@/server/application/use-cases/claim-arena-win";
import { RecordArenaDefeat } from "@/server/application/use-cases/record-arena-defeat";
import { StartArenaMatch } from "@/server/application/use-cases/start-arena-match";

type Match = {
  id: string;
  userId: string;
  difficulty: ArenaDifficulty;
  startedAt: Date;
  finishedAt: Date | null;
  outcome: "victory" | "defeat" | null;
  reward: number | null;
};

class MemoryArenaMatches implements ArenaMatchRepository {
  matches: Match[] = [];
  coins = new Map<string, number>([
    ["user-1", 0],
    ["user-2", 0],
  ]);

  constructor(private readonly clock: { now: Date }) {}

  async countRewardedSince(userId: string, since: Date) {
    return this.matches.filter(
      (entry) =>
        entry.userId === userId &&
        entry.finishedAt !== null &&
        entry.finishedAt >= since &&
        (entry.reward ?? 0) > 0,
    ).length;
  }

  async start(userId: string, difficulty: ArenaDifficulty) {
    const id = `match-${this.matches.length + 1}`;
    this.matches.push({
      id,
      userId,
      difficulty,
      startedAt: this.clock.now,
      finishedAt: null,
      outcome: null,
      reward: null,
    });
    return { id };
  }

  async claimWin(input: ArenaWinClaim): Promise<ArenaWinClaimResult> {
    const match = this.matches.find(
      (entry) => entry.id === input.matchId && entry.userId === input.userId,
    );
    if (!match) return { status: "not_found" };
    if (match.finishedAt) return { status: "already_finished" };
    if (match.startedAt > input.startedBefore) return { status: "too_fast" };
    const coins = this.coins.get(input.userId);
    if (coins === undefined) return { status: "no_wallet" };
    const previous = await this.countRewardedSince(input.userId, input.dayStart);
    const reward = previous < input.dailyLimit ? input.rewardFor(match.difficulty) : 0;
    match.finishedAt = this.clock.now;
    match.outcome = "victory";
    match.reward = reward;
    this.coins.set(input.userId, coins + reward);
    return {
      status: "ok",
      reward,
      coins: coins + reward,
      rewardedToday: previous + (reward > 0 ? 1 : 0),
    };
  }

  async recordDefeat(input: { matchId: string; userId: string }): Promise<ArenaDefeatResult> {
    const match = this.matches.find(
      (entry) => entry.id === input.matchId && entry.userId === input.userId,
    );
    if (!match) return { status: "not_found" };
    if (match.finishedAt) return { status: "already_finished" };
    match.finishedAt = this.clock.now;
    match.outcome = "defeat";
    match.reward = 0;
    return { status: "ok" };
  }
}

async function startedId(result: Promise<Awaited<ReturnType<StartArenaMatch["execute"]>>>) {
  const started = await result;
  if (!started.ok || !started.value.matchId) throw new Error("start failed");
  return started.value.matchId;
}

const ash = { id: "user-1", role: "user" as const };
const misty = { id: "user-2", role: "user" as const };

function setup() {
  const clock = { now: new Date("2026-10-21T15:00:00Z") };
  const repo = new MemoryArenaMatches(clock);
  const start = new StartArenaMatch(repo, () => clock.now);
  const claim = new ClaimArenaWin(repo, () => clock.now);
  const defeat = new RecordArenaDefeat(repo);
  const advance = (seconds: number) => {
    clock.now = new Date(clock.now.getTime() + seconds * 1000);
  };
  async function win(difficulty: ArenaDifficulty, actor = ash) {
    const matchId = await startedId(start.execute({ difficulty }, actor));
    advance(30);
    return claim.execute({ matchId }, actor);
  }
  return { repo, start, claim, defeat, advance, win };
}

describe("ClaimArenaWin", () => {
  it("pays 5 coins on normal and 10 on hard", async () => {
    const { win } = setup();
    const normal = await win("normal");
    const hard = await win("hard");
    expect(normal.ok && normal.value).toMatchObject({
      reward: 5,
      coins: 5,
      rewardedToday: 1,
    });
    expect(hard.ok && hard.value).toMatchObject({
      reward: 10,
      coins: 15,
      rewardedToday: 2,
    });
  });

  it("stops paying after 4 wins even for matches started before the cap", async () => {
    const { start, claim, advance } = setup();
    const ids: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      ids.push(await startedId(start.execute({ difficulty: index < 4 ? "normal" : "hard" }, ash)));
    }
    advance(30);
    for (const matchId of ids.slice(0, 4)) await claim.execute({ matchId }, ash);
    const fifth = await claim.execute({ matchId: ids[4] ?? "" }, ash);
    expect(fifth.ok && fifth.value).toMatchObject({
      reward: 0,
      coins: 20,
      rewardedToday: 4,
      dailyLimit: 4,
    });
  });

  it("pays again on the next São Paulo day", async () => {
    const { win, advance } = setup();
    for (let index = 0; index < 4; index += 1) await win("normal");
    advance(13 * 60 * 60);
    const next = await win("normal");
    expect(next.ok && next.value).toMatchObject({
      reward: 5,
      rewardedToday: 1,
    });
  });

  it("rejects claims made too soon after the start", async () => {
    const { start, claim, advance } = setup();
    const matchId = await startedId(start.execute({ difficulty: "hard" }, ash));
    advance(5);
    const result = await claim.execute({ matchId }, ash);
    expect(!result.ok && result.error.statusCode).toBe(400);
  });

  it("rejects claiming the same match twice", async () => {
    const { start, claim, advance } = setup();
    const matchId = await startedId(start.execute({ difficulty: "normal" }, ash));
    advance(30);
    await claim.execute({ matchId }, ash);
    const again = await claim.execute({ matchId }, ash);
    expect(!again.ok && again.error.statusCode).toBe(409);
  });

  it("hides matches owned by someone else", async () => {
    const { start, claim, advance } = setup();
    const matchId = await startedId(start.execute({ difficulty: "normal" }, ash));
    advance(30);
    const result = await claim.execute({ matchId }, misty);
    expect(!result.ok && result.error.statusCode).toBe(404);
  });

  it("requires a signed-in user", async () => {
    const { claim } = setup();
    const result = await claim.execute({ matchId: "match-1" }, null);
    expect(!result.ok && result.error.statusCode).toBe(401);
  });
});

describe("StartArenaMatch", () => {
  it("does not save a match once the daily rewarded wins are used", async () => {
    const { repo, start, win } = setup();
    for (let index = 0; index < 4; index += 1) await win("normal");
    const result = await start.execute({ difficulty: "hard" }, ash);
    expect(result.ok && result.value).toEqual({ matchId: null, rewardedToday: 4, dailyLimit: 4 });
    expect(repo.matches).toHaveLength(4);
  });

  it("keeps saving matches for other users", async () => {
    const { start, win } = setup();
    for (let index = 0; index < 4; index += 1) await win("normal");
    const result = await start.execute({ difficulty: "normal" }, misty);
    expect(result.ok && result.value.matchId).toBeTruthy();
  });
});

describe("RecordArenaDefeat", () => {
  it("finishes the match as a defeat without coins", async () => {
    const { repo, start, defeat } = setup();
    const matchId = await startedId(start.execute({ difficulty: "hard" }, ash));
    const result = await defeat.execute({ matchId }, ash);
    expect(result.ok).toBe(true);
    expect(repo.matches[0]).toMatchObject({ outcome: "defeat", reward: 0 });
    expect(repo.matches[0]?.finishedAt).not.toBeNull();
    expect(repo.coins.get("user-1")).toBe(0);
  });

  it("rejects finishing the same match twice", async () => {
    const { start, defeat, claim, advance } = setup();
    const matchId = await startedId(start.execute({ difficulty: "normal" }, ash));
    await defeat.execute({ matchId }, ash);
    advance(30);
    const again = await defeat.execute({ matchId }, ash);
    const won = await claim.execute({ matchId }, ash);
    expect(!again.ok && again.error.statusCode).toBe(409);
    expect(!won.ok && won.error.statusCode).toBe(409);
  });

  it("hides matches owned by someone else", async () => {
    const { start, defeat } = setup();
    const matchId = await startedId(start.execute({ difficulty: "normal" }, ash));
    const result = await defeat.execute({ matchId }, misty);
    expect(!result.ok && result.error.statusCode).toBe(404);
  });
});
