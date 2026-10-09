import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

async function GET(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  return nextRouteAdapter(
    (_input, actor) => container.listFollowing.execute({ username }, actor),
    { auth: "user" },
  )(req);
}

export { GET };
