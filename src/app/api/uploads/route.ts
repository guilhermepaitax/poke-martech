import { NextResponse } from "next/server";
import { getActor } from "@/lib/session";
import { container } from "@/server/container";

async function POST(req: Request) {
  try {
    const actor = await getActor(req.headers);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
    }
    const result = await container.uploadImage.execute(
      {
        filename: file.name,
        contentType: file.type,
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
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export { POST };
