import { after } from "next/server";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

export const maxDuration = 300;

async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter(
    async (_input, actor) => {
      const result = await container.retryCardGeneration.execute({ id }, actor);
      if (result.ok) after(() => container.processCardGeneration.execute(result.value.id));
      return result;
    },
    { auth: "admin", feature: FEATURE_FLAGS.aiCardGeneration },
  )(req);
}

export { POST };
