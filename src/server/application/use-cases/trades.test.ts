import { describe, expect, it } from "vitest";
import type {
  NewTrade,
  TradeRecord,
  TradeRepository,
  TradeUser,
} from "@/server/application/contracts/repositories/trade-repository";
import { AcceptTrade } from "@/server/application/use-cases/accept-trade";
import { CreateTrade } from "@/server/application/use-cases/create-trade";
import { RejectTrade } from "@/server/application/use-cases/reject-trade";
import type { TradableCard, TradeProposalView, TradeStatus } from "@/types/catalog";

type Copy = { id: string; userId: string; cardId: string; obtainedAt: number };

class MemoryTrades implements TradeRepository {
  users: TradeUser[] = [
    { id: "user-1", username: "ash", name: "Ash" },
    { id: "user-2", username: "misty", name: "Misty" },
  ];
  copies: Copy[] = [
    { id: "copy-a", userId: "user-1", cardId: "card-a", obtainedAt: 1 },
    { id: "copy-b", userId: "user-2", cardId: "card-b", obtainedAt: 1 },
  ];
  proposals: TradeRecord[] = [];

  async findUserByUsername(username: string) {
    return this.users.find((person) => person.username === username) ?? null;
  }

  async oldestFreeCopy(userId: string, cardId: string) {
    const locked = new Set(
      this.proposals
        .filter((proposal) => proposal.status === "pending")
        .flatMap((proposal) => [proposal.offeredUserCardId, proposal.requestedUserCardId]),
    );
    const match = this.copies
      .filter((copy) => copy.userId === userId && copy.cardId === cardId && !locked.has(copy.id))
      .sort((left, right) => left.obtainedAt - right.obtainedAt)[0];
    return match ? { id: match.id } : null;
  }

  async insert(input: NewTrade) {
    const locked = new Set(
      this.proposals
        .filter((proposal) => proposal.status === "pending")
        .flatMap((proposal) => [proposal.offeredUserCardId, proposal.requestedUserCardId]),
    );
    if (locked.has(input.offeredUserCardId) || locked.has(input.requestedUserCardId)) return null;
    const id = `trade-${this.proposals.length + 1}`;
    this.proposals.push({ ...input, id, status: "pending" });
    return { id };
  }

  async findById(id: string) {
    return this.proposals.find((proposal) => proposal.id === id) ?? null;
  }

  async list(): Promise<TradeProposalView[]> {
    return [];
  }

  async pendingIncoming(): Promise<TradeProposalView[]> {
    return [];
  }

  async listFreeOffers(): Promise<TradableCard[]> {
    return [];
  }

  async exchange(id: string) {
    const proposal = this.proposals.find((item) => item.id === id);
    if (!proposal) return "missing" as const;
    if (proposal.status !== "pending") return "not-pending" as const;
    const offered = this.copies.find((copy) => copy.id === proposal.offeredUserCardId);
    const requested = this.copies.find((copy) => copy.id === proposal.requestedUserCardId);
    if (!offered || !requested) return "ownership" as const;
    if (offered.userId !== proposal.fromUserId || requested.userId !== proposal.toUserId) {
      return "ownership" as const;
    }
    const reserved = this.proposals.some(
      (item) =>
        item.status === "pending" &&
        item.id !== id &&
        [item.offeredUserCardId, item.requestedUserCardId].some(
          (copyId) => copyId === offered.id || copyId === requested.id,
        ),
    );
    if (reserved) return "reserved" as const;
    offered.userId = proposal.toUserId;
    requested.userId = proposal.fromUserId;
    proposal.status = "accepted";
    return "ok" as const;
  }

  async setStatus(id: string, status: Extract<TradeStatus, "rejected" | "cancelled">) {
    const proposal = this.proposals.find((item) => item.id === id);
    if (!proposal || proposal.status !== "pending") return false;
    proposal.status = status;
    return true;
  }
}

function pendingProposal(): TradeRecord {
  return {
    id: "trade-1",
    fromUserId: "user-1",
    toUserId: "user-2",
    offeredUserCardId: "copy-a",
    requestedUserCardId: "copy-b",
    status: "pending",
  };
}

describe("trades", () => {
  it("swaps card owners when the recipient accepts", async () => {
    const trades = new MemoryTrades();
    trades.proposals.push(pendingProposal());
    const result = await new AcceptTrade(trades).execute({ id: "trade-1" }, { id: "user-2", role: "user" });
    expect(result.ok).toBe(true);
    expect(trades.copies.find((copy) => copy.id === "copy-a")?.userId).toBe("user-2");
    expect(trades.copies.find((copy) => copy.id === "copy-b")?.userId).toBe("user-1");
    expect(trades.proposals[0]?.status).toBe("accepted");
  });

  it("rejects a refusal from someone who did not receive the proposal", async () => {
    const trades = new MemoryTrades();
    trades.proposals.push(pendingProposal());
    const result = await new RejectTrade(trades).execute({ id: "trade-1" }, { id: "user-1", role: "user" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.statusCode).toBe(403);
    expect(trades.proposals[0]?.status).toBe("pending");
  });

  it("refuses a new proposal when the offered copy is already reserved", async () => {
    const trades = new MemoryTrades();
    trades.proposals.push(pendingProposal());
    const result = await new CreateTrade(trades).execute(
      { targetUsername: "misty", offeredCardId: "card-a", requestedCardId: "card-b" },
      { id: "user-1", role: "user" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CONFLICT");
    expect(trades.proposals).toHaveLength(1);
  });
});
