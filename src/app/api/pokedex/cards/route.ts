import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { pokedexQuerySchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

const GET = nextRouteAdapter(
  (_input, actor, query) => container.listPokedexPage.execute(query, actor),
  { auth: "user", query: pokedexQuerySchema },
);

export { GET };
