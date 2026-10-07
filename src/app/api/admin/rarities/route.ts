import { rarityWeightsSchema } from "@/server/adapters/next/schemas";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

const GET = nextRouteAdapter((_input, actor) => container.listRarityWeights.execute(actor), {
  auth: "admin",
});

const PUT = nextRouteAdapter(
  (input, actor) => container.upsertRarityWeights.execute(input, actor),
  { schema: rarityWeightsSchema, auth: "admin" },
);

export { GET, PUT };
