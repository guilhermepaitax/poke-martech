import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return nextRouteAdapter((_input, actor) => container.getBooster.execute({ slug }, actor), {
    auth: "user",
  })(req);
}

export { GET };
