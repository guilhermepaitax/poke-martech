import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { container } from "@/server/container";

async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter(
    (_input, actor) => container.recordArenaDefeat.execute({ matchId: id }, actor),
    {
      auth: "user",
      feature: FEATURE_FLAGS.arena,
      ids: [id],
      rateLimit: RATE_LIMITS.arenaMatch,
    },
  )(req);
}

export { POST };
