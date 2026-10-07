import { cardSchema } from "@/server/adapters/next/schemas";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

const GET = nextRouteAdapter((_input, actor) => container.listAdminCards.execute(actor), {
  auth: "admin",
});

const POST = nextRouteAdapter(
  (input, actor) => container.createCard.execute(input, actor),
  { schema: cardSchema, auth: "admin" },
);

export { GET, POST };
