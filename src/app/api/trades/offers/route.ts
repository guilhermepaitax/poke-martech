import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

async function GET(req: Request) {
  return nextRouteAdapter((_input, actor) => container.listTradableCards.execute(actor), {
    auth: "user",
  })(req);
}

export { GET };
