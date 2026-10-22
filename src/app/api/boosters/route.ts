import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

const GET = nextRouteAdapter((_input, actor) => container.listBoosters.execute(actor), {
  auth: "user",
  feature: FEATURE_FLAGS.loja,
});

export { GET };
