import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { createTradeSchema, tradesQuerySchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

const GET = nextRouteAdapter(
  (_input, actor, query) => container.listTrades.execute(query, actor),
  { auth: "user", query: tradesQuerySchema, feature: FEATURE_FLAGS.trocas },
);

async function POST(req: Request) {
  return nextRouteAdapter((input, actor) => container.createTrade.execute(input, actor), {
    schema: createTradeSchema,
    auth: "user",
    feature: FEATURE_FLAGS.trocas,
    rateLimit: RATE_LIMITS.tradeCreate,
  })(req);
}

export { GET, POST };
