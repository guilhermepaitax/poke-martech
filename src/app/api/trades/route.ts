import { NextResponse } from "next/server";
import { z } from "zod";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { createTradeSchema } from "@/server/adapters/next/schemas";
import { container } from "@/server/container";

const boxSchema = z.enum(["incoming", "outgoing"]);

async function GET(req: Request) {
  const box = boxSchema.safeParse(new URL(req.url).searchParams.get("box"));
  if (!box.success) {
    return NextResponse.json(
      { error: "Informe se a lista é recebida ou enviada." },
      { status: 400 },
    );
  }
  return nextRouteAdapter(
    (_input, actor) => container.listTrades.execute({ box: box.data }, actor),
    { auth: "user" },
  )(req);
}

async function POST(req: Request) {
  return nextRouteAdapter((input, actor) => container.createTrade.execute(input, actor), {
    schema: createTradeSchema,
    auth: "user",
    rateLimit: RATE_LIMITS.tradeCreate,
  })(req);
}

export { GET, POST };
