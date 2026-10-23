import Link from "next/link";
import { redirect } from "next/navigation";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureEnabled } from "@/lib/feature-flags.server";
import { getServerSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession();
  const role = session && "role" in session.user ? session.user.role : null;
  if (role !== "admin") redirect("/home");
  const mapEditorEnabled = await isFeatureEnabled(FEATURE_FLAGS.arenaMapEditor);

  return (
    <div className="flex flex-col gap-6">
      <nav className="glass flex w-fit flex-wrap gap-1 rounded-full p-1 text-sm">
        <Link href="/admin/cartas" className="rounded-full px-3 py-1.5 text-foreground-subtle hover:bg-white/70 hover:text-foreground">Cartas</Link>
        <Link href="/admin/boosters" className="rounded-full px-3 py-1.5 text-foreground-subtle hover:bg-white/70 hover:text-foreground">Pacotes</Link>
        <Link href="/admin/raridades" className="rounded-full px-3 py-1.5 text-foreground-subtle hover:bg-white/70 hover:text-foreground">Raridades</Link>
        {mapEditorEnabled ? (
          <Link href="/admin/mapas" className="rounded-full px-3 py-1.5 text-foreground-subtle hover:bg-white/70 hover:text-foreground">Mapas</Link>
        ) : null}
      </nav>
      {children}
    </div>
  );
}
