import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { arenaMatchSchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

async function POST(req: Request) {
  return nextRouteAdapter((input, actor) => container.startArenaMatch.execute(input, actor), {
    schema: arenaMatchSchema,
    auth: "user",
    feature: FEATURE_FLAGS.arena,
    rateLimit: RATE_LIMITS.arenaMatch,
  })(req);
}

export { POST };
