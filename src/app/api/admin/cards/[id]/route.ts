import { cardSchema } from "@/server/adapters/next/schemas";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.getAdminCard.execute({ id }, actor), {
    auth: "admin",
  })(req);
}

async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter(
    (input, actor) => container.updateCard.execute({ ...input, id }, actor),
    { schema: cardSchema, auth: "admin" },
  )(req);
}

export { GET, PATCH };
