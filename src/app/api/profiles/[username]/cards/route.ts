import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { pokedexQuerySchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

async function GET(req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  return nextRouteAdapter(
    (_input, actor, query) => container.listProfileCards.execute({ ...query, username }, actor),
    { auth: "user", query: pokedexQuerySchema },
  )(req);
}

export { GET };
