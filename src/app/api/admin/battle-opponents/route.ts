import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { battleOpponentSchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

const GET = nextRouteAdapter((_input, actor) => container.listAdminOpponents.execute(_input, actor), {
  auth: "admin",
});

const POST = nextRouteAdapter(
  (input, actor) => container.createOpponent.execute(input, actor),
  { schema: battleOpponentSchema, auth: "admin", feature: FEATURE_FLAGS.opponentRegistration },
);

export { GET, POST };
