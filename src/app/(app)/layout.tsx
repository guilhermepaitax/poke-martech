import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ObservabilityIdentity } from "@/components/analytics/observability-identity";
import { AppShell } from "@/components/app-shell/app-shell";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const username = "username" in session.user && typeof session.user.username === "string"
    ? session.user.username
    : "treinador";
  const role = "role" in session.user && typeof session.user.role === "string"
    ? session.user.role
    : "user";

  return (
    <>
      <ObservabilityIdentity userId={session.user.id} username={username} />
      <AppShell role={role} username={username}>
        {children}
      </AppShell>
    </>
  );
}
