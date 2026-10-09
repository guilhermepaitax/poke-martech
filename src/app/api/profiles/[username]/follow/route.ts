import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

async function POST(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  return nextRouteAdapter(
    (_input, actor) => container.followUser.execute({ username }, actor),
    { auth: "user" },
  )(req);
}

async function DELETE(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  return nextRouteAdapter(
    (_input, actor) => container.unfollowUser.execute({ username }, actor),
    { auth: "user" },
  )(req);
}

export { DELETE, POST };
