import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

const GET = nextRouteAdapter((_input, actor) => container.listAdminTags.execute(actor), {
  auth: "admin",
});

export { GET };
