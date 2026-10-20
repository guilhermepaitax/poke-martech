import { sql } from "drizzle-orm";
import type {
  RateLimitDecision,
  RateLimiter,
  RateLimitRule,
} from "@/server/application/contracts/services/rate-limiter";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { appRateLimits } from "@/server/infrastructure/db/drizzle/schema";

class DrizzleRateLimiter implements RateLimiter {
  async consume(key: string, rule: RateLimitRule): Promise<RateLimitDecision> {
    const expired = sql`${appRateLimits.windowStart} <= now() - make_interval(secs => ${rule.windowSeconds})`;
    const rows = await db
      .insert(appRateLimits)
      .values({ key, count: 1, windowStart: sql`now()` })
      .onConflictDoUpdate({
        target: appRateLimits.key,
        set: {
          count: sql`case when ${expired} then 1 else ${appRateLimits.count} + 1 end`,
          windowStart: sql`case when ${expired} then now() else ${appRateLimits.windowStart} end`,
        },
      })
      .returning({
        count: appRateLimits.count,
        retryAfter: sql<number>`ceil(extract(epoch from (${appRateLimits.windowStart} + make_interval(secs => ${rule.windowSeconds}) - now())))::int`,
      });
    const row = rows[0];
    if (!row) return { allowed: true, retryAfterSeconds: 0 };
    return {
      allowed: row.count <= rule.max,
      retryAfterSeconds: Math.max(1, row.retryAfter),
    };
  }
}

export { DrizzleRateLimiter };
