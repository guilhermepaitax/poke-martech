import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getActor } from "@/lib/session";
import { rateLimited } from "@/server/adapters/next/http-adapter";
import { RATE_LIMITS } from "@/server/adapters/next/rate-limits";
import { MAX_UPLOAD_BYTES } from "@/server/application/use-cases/upload-image";
import { container } from "@/server/container";

const MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

async function POST(req: Request) {
  try {
    const actor = await getActor(req.headers);
    if (!actor) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (actor.role !== "admin") {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    const limited = await rateLimited(RATE_LIMITS.upload, actor);
    if (limited) return limited;
    const length = Number(req.headers.get("content-length"));
    if (!length || length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "A imagem deve ter até 4 MB." }, { status: 413 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
    }
    const result = await container.uploadImage.execute(
      {
        filename: file.name,
        bytes: new Uint8Array(await file.arrayBuffer()),
      },
      actor,
    );
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode },
      );
    }
    return NextResponse.json(result.value);
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export { POST };
