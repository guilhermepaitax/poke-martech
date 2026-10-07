import { boosterSchema } from "@/server/adapters/next/schemas";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

const GET = nextRouteAdapter((_input, actor) => container.listAdminBoosters.execute(actor), {
  auth: "admin",
});

const POST = nextRouteAdapter(
  (input, actor) => container.createBooster.execute(input, actor),
  { schema: boosterSchema, auth: "admin" },
);

export { GET, POST };
