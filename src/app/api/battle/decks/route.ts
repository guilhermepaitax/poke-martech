import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { battleDeckSchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

const GET = nextRouteAdapter((_input, actor) => container.listMyDecks.execute(_input, actor), {
  auth: "user",
  feature: FEATURE_FLAGS.battle,
});

const POST = nextRouteAdapter(
  (input, actor) => container.saveDeck.execute(input, actor),
  { schema: battleDeckSchema, auth: "user", feature: FEATURE_FLAGS.battle },
);

export { GET, POST };
