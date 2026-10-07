import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { battleOpponentSchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.getAdminOpponent.execute({ id }, actor), {
    auth: "admin",
  })(req);
}

async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter(
    (input, actor) => container.updateOpponent.execute({ ...input, id }, actor),
    { schema: battleOpponentSchema, auth: "admin" },
  )(req);
}

export { GET, PATCH };
