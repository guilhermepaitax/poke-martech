import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { submitBattleActionSchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter(
    (input, actor) => container.submitBattleAction.execute({ ...input, id }, actor),
    { schema: submitBattleActionSchema, auth: "user", feature: FEATURE_FLAGS.battle },
  )(req);
}

export { POST };
