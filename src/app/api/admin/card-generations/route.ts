import { after } from "next/server";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { cardGenerationSchema } from "@/server/adapters/next/schemas";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

export const maxDuration = 300;

const GET = nextRouteAdapter((_input, actor) => container.listCardGenerations.execute(actor), {
  auth: "admin",
  feature: FEATURE_FLAGS.aiCardGeneration,
});

const POST = nextRouteAdapter(
  async (input, actor) => {
    const result = await container.startCardGeneration.execute(input, actor);
    if (result.ok) after(() => container.processCardGeneration.execute(result.value.id));
    return result;
  },
  { schema: cardGenerationSchema, auth: "admin", feature: FEATURE_FLAGS.aiCardGeneration },
);

export { GET, POST };
