import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { battleDeckSchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.getDeck.execute({ id }, actor), {
    auth: "user",
    feature: FEATURE_FLAGS.battle,
  })(req);
}

async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter(
    (input, actor) => container.saveDeck.execute({ ...input, id }, actor),
    { schema: battleDeckSchema, auth: "user", feature: FEATURE_FLAGS.battle },
  )(req);
}

async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.deleteDeck.execute({ id }, actor), {
    auth: "user",
    feature: FEATURE_FLAGS.battle,
  })(req);
}

export { DELETE, GET, PATCH };
