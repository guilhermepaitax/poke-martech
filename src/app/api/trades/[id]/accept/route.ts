import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { container } from "@/server/container";

async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.acceptTrade.execute({ id }, actor), {
    ids: [id],
    auth: "user",
    rateLimit: RATE_LIMITS.tradeAction,
  })(req);
}

export { POST };
