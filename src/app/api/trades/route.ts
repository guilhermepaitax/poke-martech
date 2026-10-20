import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { createTradeSchema, tradesQuerySchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

const GET = nextRouteAdapter(
  (_input, actor, query) => container.listTrades.execute(query, actor),
  { auth: "user", query: tradesQuerySchema },
);

async function POST(req: Request) {
  return nextRouteAdapter((input, actor) => container.createTrade.execute(input, actor), {
    schema: createTradeSchema,
    auth: "user",
    rateLimit: RATE_LIMITS.tradeCreate,
  })(req);
}

export { GET, POST };
