import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

const GET = nextRouteAdapter((_input, actor) => container.listPokedex.execute(actor), {
  auth: "user",
});

export { GET };
