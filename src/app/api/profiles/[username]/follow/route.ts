import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { container } from "@/server/container";

async function POST(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  return nextRouteAdapter(
    (_input, actor) => container.followUser.execute({ username }, actor),
    { auth: "user", rateLimit: RATE_LIMITS.follow },
  )(req);
}

async function DELETE(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  return nextRouteAdapter(
    (_input, actor) => container.unfollowUser.execute({ username }, actor),
    { auth: "user", rateLimit: RATE_LIMITS.follow },
  )(req);
}

export { DELETE, POST };
