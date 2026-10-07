import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.getBattle.execute({ id }, actor), {
    auth: "user",
    feature: FEATURE_FLAGS.battle,
  })(req);
}

export { GET };
