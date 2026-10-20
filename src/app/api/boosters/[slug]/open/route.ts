import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { container } from "@/server/container";

async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.openPack.execute({ slug }, actor), {
    auth: "user",
    rateLimit: RATE_LIMITS.openPack,
  })(req);
}

export { POST };
