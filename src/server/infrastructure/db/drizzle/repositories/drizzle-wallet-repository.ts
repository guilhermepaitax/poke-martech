import { eq } from "drizzle-orm";
import type { WalletRepository } from "@/server/application/contracts/repositories/wallet-repository";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { coinLedger, wallets } from "@/server/infrastructure/db/drizzle/schema";

class DrizzleWalletRepository implements WalletRepository {
  async grantSignupBonus(userId: string, amount: number): Promise<void> {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .limit(1);
      if (existing.length > 0) return;

      await tx.insert(wallets).values({ userId, coins: amount });
      await tx.insert(coinLedger).values({
        userId,
        amount,
        reason: "signup_bonus",
        balanceAfter: amount,
        referenceId: userId,
      });
    });
  }
}

export { DrizzleWalletRepository };
