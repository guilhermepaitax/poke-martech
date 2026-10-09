import { and, asc, desc, eq, inArray, ne, notExists, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { isTradeStatus } from "@/lib/value-objects/trade";
import type {
  ExchangeResult,
  NewTrade,
  TradeRecord,
  TradeRepository,
} from "@/server/application/contracts/repositories/trade-repository";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { cards, tradeProposals, user, userCards } from "@/server/infrastructure/db/drizzle/schema";
import type { TradableCard, TradeProposalView } from "@/types/catalog";

class DrizzleTradeRepository implements TradeRepository {
  async findUserByUsername(username: string) {
    const rows = await db
      .select({ id: user.id, username: user.username, name: user.name })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);
    return rows[0] ?? null;
  }

  async oldestFreeCopy(userId: string, cardId: string): Promise<{ id: string } | null> {
    const rows = await db
      .select({ id: userCards.id })
      .from(userCards)
      .where(
        and(eq(userCards.userId, userId), eq(userCards.cardId, cardId), notExists(pendingLock(userCards.id))),
      )
      .orderBy(asc(userCards.obtainedAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async insert(input: NewTrade): Promise<{ id: string } | null> {
    if (input.offeredUserCardId === input.requestedUserCardId) return null;
    return db.transaction(async (tx) => {
      const copies = await tx
        .select()
        .from(userCards)
        .where(inArray(userCards.id, [input.offeredUserCardId, input.requestedUserCardId]))
        .for("update");
      const offered = copies.find((row) => row.id === input.offeredUserCardId);
      const requested = copies.find((row) => row.id === input.requestedUserCardId);
      if (!offered || offered.userId !== input.fromUserId) return null;
      if (!requested || requested.userId !== input.toUserId) return null;
      const copyIds = [offered.id, requested.id];
      const locks = await tx
        .select({ id: tradeProposals.id })
        .from(tradeProposals)
        .where(
          and(
            eq(tradeProposals.status, "pending"),
            or(
              inArray(tradeProposals.offeredUserCardId, copyIds),
              inArray(tradeProposals.requestedUserCardId, copyIds),
            ),
          ),
        )
        .limit(1);
      if (locks.length > 0) return null;
      const inserted = await tx
        .insert(tradeProposals)
        .values({
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
          offeredUserCardId: input.offeredUserCardId,
          requestedUserCardId: input.requestedUserCardId,
          status: "pending",
        })
        .returning({ id: tradeProposals.id });
      return inserted[0] ?? null;
    });
  }

  async findById(id: string): Promise<TradeRecord | null> {
    const rows = await db.select().from(tradeProposals).where(eq(tradeProposals.id, id)).limit(1);
    const row = rows[0];
    if (!row || !isTradeStatus(row.status)) return null;
    return {
      id: row.id,
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      offeredUserCardId: row.offeredUserCardId,
      requestedUserCardId: row.requestedUserCardId,
      status: row.status,
    };
  }

  async list(userId: string, box: "incoming" | "outgoing"): Promise<TradeProposalView[]> {
    const column = box === "incoming" ? tradeProposals.toUserId : tradeProposals.fromUserId;
    return this.selectViews(eq(column, userId));
  }

  async pendingIncoming(userId: string, limit: number): Promise<TradeProposalView[]> {
    return this.selectViews(
      and(eq(tradeProposals.toUserId, userId), eq(tradeProposals.status, "pending")),
      limit,
    );
  }

  async listFreeOffers(userId: string): Promise<TradableCard[]> {
    const rows = await db
      .select({
        cardId: cards.id,
        name: cards.name,
        number: cards.number,
        imageUrl: cards.imageUrl,
        freeCount: sql<number>`count(${userCards.id})::int`,
      })
      .from(userCards)
      .innerJoin(cards, eq(cards.id, userCards.cardId))
      .where(and(eq(userCards.userId, userId), notExists(pendingLock(userCards.id))))
      .groupBy(cards.id, cards.name, cards.number, cards.imageUrl)
      .orderBy(asc(cards.number));
    return rows;
  }

  async exchange(id: string): Promise<ExchangeResult> {
    return db.transaction(async (tx) => {
      const proposals = await tx
        .select()
        .from(tradeProposals)
        .where(eq(tradeProposals.id, id))
        .for("update")
        .limit(1);
      const proposal = proposals[0];
      if (!proposal || !isTradeStatus(proposal.status)) return "missing";
      if (proposal.status !== "pending") return "not-pending";
      const copyIds = [proposal.offeredUserCardId, proposal.requestedUserCardId];
      const copies = await tx
        .select()
        .from(userCards)
        .where(inArray(userCards.id, copyIds))
        .for("update");
      const offered = copies.find((row) => row.id === proposal.offeredUserCardId);
      const requested = copies.find((row) => row.id === proposal.requestedUserCardId);
      if (!offered || !requested) return "ownership";
      if (offered.userId !== proposal.fromUserId || requested.userId !== proposal.toUserId) {
        return "ownership";
      }
      const locks = await tx
        .select({ id: tradeProposals.id })
        .from(tradeProposals)
        .where(
          and(
            eq(tradeProposals.status, "pending"),
            ne(tradeProposals.id, id),
            or(
              inArray(tradeProposals.offeredUserCardId, copyIds),
              inArray(tradeProposals.requestedUserCardId, copyIds),
            ),
          ),
        )
        .limit(1);
      if (locks.length > 0) return "reserved";
      await tx.update(userCards).set({ userId: proposal.toUserId }).where(eq(userCards.id, offered.id));
      await tx
        .update(userCards)
        .set({ userId: proposal.fromUserId })
        .where(eq(userCards.id, requested.id));
      await tx
        .update(tradeProposals)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(eq(tradeProposals.id, id));
      return "ok";
    });
  }

  async setStatus(id: string, status: "rejected" | "cancelled"): Promise<boolean> {
    const rows = await db
      .update(tradeProposals)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(tradeProposals.id, id), eq(tradeProposals.status, "pending")))
      .returning({ id: tradeProposals.id });
    return rows.length > 0;
  }

  private async selectViews(where: SQL | undefined, limit?: number): Promise<TradeProposalView[]> {
    const offeredCopy = alias(userCards, "offered_copy");
    const requestedCopy = alias(userCards, "requested_copy");
    const offeredCard = alias(cards, "offered_card");
    const requestedCard = alias(cards, "requested_card");
    const proposer = alias(user, "trade_from_user");
    const recipient = alias(user, "trade_to_user");
    const query = db
      .select({
        id: tradeProposals.id,
        status: tradeProposals.status,
        createdAt: tradeProposals.createdAt,
        fromUsername: proposer.username,
        fromName: proposer.name,
        toUsername: recipient.username,
        toName: recipient.name,
        offeredCardId: offeredCard.id,
        offeredName: offeredCard.name,
        offeredNumber: offeredCard.number,
        offeredImageUrl: offeredCard.imageUrl,
        requestedCardId: requestedCard.id,
        requestedName: requestedCard.name,
        requestedNumber: requestedCard.number,
        requestedImageUrl: requestedCard.imageUrl,
      })
      .from(tradeProposals)
      .innerJoin(proposer, eq(proposer.id, tradeProposals.fromUserId))
      .innerJoin(recipient, eq(recipient.id, tradeProposals.toUserId))
      .innerJoin(offeredCopy, eq(offeredCopy.id, tradeProposals.offeredUserCardId))
      .innerJoin(offeredCard, eq(offeredCard.id, offeredCopy.cardId))
      .innerJoin(requestedCopy, eq(requestedCopy.id, tradeProposals.requestedUserCardId))
      .innerJoin(requestedCard, eq(requestedCard.id, requestedCopy.cardId))
      .where(where)
      .orderBy(desc(tradeProposals.createdAt));
    const rows = await (limit === undefined ? query : query.limit(limit));
    return rows.flatMap((row) => {
      if (!isTradeStatus(row.status)) return [];
      return [
        {
          id: row.id,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          from: { username: row.fromUsername, name: row.fromName },
          to: { username: row.toUsername, name: row.toName },
          offered: {
            cardId: row.offeredCardId,
            name: row.offeredName,
            number: row.offeredNumber,
            imageUrl: row.offeredImageUrl,
          },
          requested: {
            cardId: row.requestedCardId,
            name: row.requestedName,
            number: row.requestedNumber,
            imageUrl: row.requestedImageUrl,
          },
        },
      ];
    });
  }
}

function pendingLock(copyId: typeof userCards.id) {
  return db
    .select({ id: tradeProposals.id })
    .from(tradeProposals)
    .where(
      and(
        eq(tradeProposals.status, "pending"),
        or(eq(tradeProposals.offeredUserCardId, copyId), eq(tradeProposals.requestedUserCardId, copyId)),
      ),
    );
}

export { DrizzleTradeRepository };
