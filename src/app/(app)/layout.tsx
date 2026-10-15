import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ObservabilityIdentity } from "@/components/analytics/observability-identity";
import { AppShell } from "@/components/app-shell/app-shell";
import { auth } from "@/lib/auth";
import { loginPath, safeCallbackUrl } from "@/lib/profile-share";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    const callback = safeCallbackUrl(requestHeaders.get("x-pathname"));
    redirect(callback ? loginPath(callback) : "/entrar");
  }
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
