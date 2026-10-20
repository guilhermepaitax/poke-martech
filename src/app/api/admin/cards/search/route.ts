import { NextResponse } from "next/server";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { cardSearchSchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const query = cardSearchSchema.safeParse({
    name: params.get("q") ?? "",
    excludeId: params.get("exclude"),
  });
  if (!query.success) {
    return NextResponse.json({ error: "Busca inválida." }, { status: 400 });
  }
  return nextRouteAdapter(
    (_input, actor) => container.searchAdminCards.execute(query.data, actor),
    { auth: "admin" },
  )(req);
}

export { GET };
