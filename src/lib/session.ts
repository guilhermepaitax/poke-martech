import { auth } from "@/lib/auth";
import type { Actor } from "@/server/application/actor";

async function getActor(headers: Headers): Promise<Actor | null> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user) return null;
  const role = "role" in session.user && typeof session.user.role === "string"
    ? session.user.role
    : "user";
  return { id: session.user.id, role };
}

export { getActor };
