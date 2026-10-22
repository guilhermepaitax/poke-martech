import type { FeatureFlag } from "@/lib/feature-flags";
import { isFeatureEnabled } from "@/lib/feature-flags.server";
import { getActor } from "@/lib/session";
import { trackFeatureFlag } from "@/lib/track-feature-flags";
import { idParamSchema } from "@/server/adapters/next/schemas";
import type { Actor } from "@/server/application/actor";
import type { RateLimitRule } from "@/server/application/contracts/services/rate-limiter";
import { container } from "@/server/container";
import type { AppError } from "@/server/shared/app-error";
import type { Result } from "@/server/shared/result";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

type AuthMode = "public" | "user" | "admin";

function nextRouteAdapter<TInput, TOutput, TQuery = undefined>(
  handler: (
    input: TInput,
    actor: Actor | null,
    query: TQuery,
  ) => Promise<Result<TOutput, AppError>>,
  options?: {
    schema?: ZodType<TInput>;
    query?: ZodType<TQuery>;
    auth?: AuthMode;
    feature?: FeatureFlag;
    ids?: string[];
    rateLimit?: RateLimitRule & { name: string };
  },
) {
  return async (req: Request) => {
    try {
      if (options?.feature) {
        const enabled = await isFeatureEnabled(options.feature);
        trackFeatureFlag(options.feature, enabled);
        if (!enabled) {
          return NextResponse.json(
            { error: "Funcionalidade indisponível." },
            { status: 404 },
          );
        }
      }

      const actor = await getActor(req.headers);
      const auth = options?.auth ?? "public";
      if ((auth === "user" || auth === "admin") && !actor) {
        return NextResponse.json(
          { error: "Não autenticado." },
          { status: 401 },
        );
      }
      if (auth === "admin" && actor?.role !== "admin") {
        return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
      }

      if (options?.rateLimit && actor) {
        const limited = await rateLimited(options.rateLimit, actor);
        if (limited) return limited;
      }

      if (options?.ids?.some((id) => !idParamSchema.safeParse(id).success)) {
        return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
      }

      let query = undefined as TQuery;
      if (options?.query) {
        const params = Object.fromEntries(new URL(req.url).searchParams);
        const parsed = options.query.safeParse(params);
        if (!parsed.success) {
          const message = parsed.error.issues
            .map((issue) => issue.message)
            .join(", ");
          return NextResponse.json({ error: message }, { status: 400 });
        }
        query = parsed.data;
      }

      let input = undefined as TInput;
      if (options?.schema) {
        const body: unknown = await req.json();
        const parsed = options.schema.safeParse(body);
        if (!parsed.success) {
          const message = parsed.error.issues
            .map((issue) => issue.message)
            .join(", ");
          return NextResponse.json({ error: message }, { status: 400 });
        }
        input = parsed.data;
      }

      const result = await handler(input, actor, query);
      if (!result.ok) {
        if (result.error.statusCode >= 500) {
          const exception = new Error(result.error.message);
          exception.name = result.error.code;
          Sentry.captureException(exception);
        }
        return NextResponse.json(
          { error: result.error.message },
          { status: result.error.statusCode },
        );
      }

      return NextResponse.json(result.value ?? { success: true });
    } catch (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }
  };
}

async function rateLimited(
  rule: RateLimitRule & { name: string },
  actor: Actor,
) {
  const decision = await container.rateLimiter.consume(
    `${rule.name}:${actor.id}`,
    rule,
  );
  if (decision.allowed) return null;
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde um pouco e tente de novo." },
    {
      status: 429,
      headers: { "Retry-After": String(decision.retryAfterSeconds) },
    },
  );
}

export { nextRouteAdapter, rateLimited };
