import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.getOpening.execute({ id }, actor), {
    auth: "user",
  })(req);
}

export { GET };
