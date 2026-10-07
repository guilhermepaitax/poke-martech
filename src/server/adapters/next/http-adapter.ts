import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { isFeatureEnabled, type FeatureFlag } from "@/lib/feature-flags";
import { getActor } from "@/lib/session";
import { trackFeatureFlag } from "@/lib/track-feature-flags";
import type { Actor } from "@/server/application/actor";
import type { AppError } from "@/server/shared/app-error";
import type { Result } from "@/server/shared/result";

type AuthMode = "public" | "user" | "admin";

function nextRouteAdapter<TInput, TOutput>(
  handler: (input: TInput, actor: Actor | null) => Promise<Result<TOutput, AppError>>,
  options?: {
    schema?: ZodType<TInput>;
    auth?: AuthMode;
    feature?: FeatureFlag;
  },
) {
  return async (req: Request) => {
    try {
      if (options?.feature) {
        const enabled = isFeatureEnabled(options.feature);
        trackFeatureFlag(options.feature, enabled);
        if (!enabled) {
          return NextResponse.json({ error: "Funcionalidade indisponível." }, { status: 404 });
        }
      }

      const actor = await getActor(req.headers);
      const auth = options?.auth ?? "public";
      if ((auth === "user" || auth === "admin") && !actor) {
        return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
      }
      if (auth === "admin" && actor?.role !== "admin") {
        return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
      }

      let input = undefined as TInput;
      if (options?.schema) {
        const body: unknown = await req.json();
        const parsed = options.schema.safeParse(body);
        if (!parsed.success) {
          const message = parsed.error.issues.map((issue) => issue.message).join(", ");
          return NextResponse.json({ error: message }, { status: 400 });
        }
        input = parsed.data;
      }

      const result = await handler(input, actor);
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

export { nextRouteAdapter };
