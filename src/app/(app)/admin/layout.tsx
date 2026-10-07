import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session && "role" in session.user ? session.user.role : null;
  if (role !== "admin") redirect("/");

  return (
    <div className="flex flex-col gap-6">
      <nav className="glass flex w-fit flex-wrap gap-1 rounded-full p-1 text-sm">
        <Link href="/admin/cartas" className="rounded-full px-3 py-1.5 text-foreground-subtle hover:bg-white/70 hover:text-foreground">Cartas</Link>
        <Link href="/admin/boosters" className="rounded-full px-3 py-1.5 text-foreground-subtle hover:bg-white/70 hover:text-foreground">Pacotes</Link>
        <Link href="/admin/raridades" className="rounded-full px-3 py-1.5 text-foreground-subtle hover:bg-white/70 hover:text-foreground">Raridades</Link>
        <Link href="/admin/adversarios" className="rounded-full px-3 py-1.5 text-foreground-subtle hover:bg-white/70 hover:text-foreground">Adversários</Link>
      </nav>
      {children}
    </div>
  );
}
