"use client";

import {
  ArenaCanvasLayoutProvider,
  useArenaCanvasLayout,
} from "@/components/arena/arena-canvas-layout";
import { useFeatureFlag } from "@/components/feature-flags/use-feature-flags";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { authClient } from "@/lib/auth-client";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface AppShellProps {
  role: string;
  username: string;
  children: ReactNode;
}

function NavLink({
  href,
  active,
  target,
  children,
}: {
  href: string;
  active: boolean;
  target?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      data-active={active ? "" : undefined}
      data-nav-target={target}
      className="rounded-full px-3 py-1.5 text-sm text-foreground-subtle hover:text-foreground data-active:bg-white/80 data-active:text-foreground data-active:shadow-sm cursor-pointer data-active:font-semibold"
    >
      {children}
    </Link>
  );
}

function AppShell({ role, username, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <ArenaCanvasLayoutProvider pathname={pathname}>
      <AppShellFrame role={role} username={username}>
        {children}
      </AppShellFrame>
    </ArenaCanvasLayoutProvider>
  );
}

function AppShellFrame({ role, username, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useProfile();
  const arenaEnabled = useFeatureFlag(FEATURE_FLAGS.arena);
  const shopEnabled = useFeatureFlag(FEATURE_FLAGS.loja);
  const pokedexEnabled = useFeatureFlag(FEATURE_FLAGS.pokedex);
  const tradesEnabled = useFeatureFlag(FEATURE_FLAGS.trocas);
  const canvas = useArenaCanvasLayout();
  const arenaLayout = pathname === "/batalha" && canvas.active;
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const update = () =>
      setHeaderHeight(Math.ceil(header.getBoundingClientRect().height + 12));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const profileHref = `/u/${username}`;
  const links: {
    href: string;
    label: string;
    active: boolean;
    target?: string;
  }[] = [
    ...(shopEnabled
      ? [{ href: "/loja", label: "Loja", active: pathname.startsWith("/loja") }]
      : []),
    ...(pokedexEnabled
      ? [
          {
            href: "/pokedex",
            label: "Pokédex",
            active: pathname.startsWith("/pokedex"),
            target: "pokedex",
          },
        ]
      : []),
    ...(arenaEnabled
      ? [
          {
            href: "/batalha",
            label: "Batalha",
            active: pathname.startsWith("/batalha"),
          },
        ]
      : []),
    ...(tradesEnabled
      ? [
          {
            href: "/trocas",
            label: "Trocas",
            active: pathname.startsWith("/trocas"),
          },
        ]
      : []),
    { href: profileHref, label: "Perfil", active: pathname === profileHref },
    ...(role === "admin"
      ? [
          {
            href: "/admin/cartas",
            label: "Admin",
            active: pathname.startsWith("/admin"),
          },
        ]
      : []),
  ];

  return (
    <div data-slot="app-shell" className="min-h-full">
      <header
        ref={headerRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3"
      >
        <div className="glass pointer-events-auto mx-auto flex max-w-5xl items-center gap-2 rounded-full px-3 py-2">
          <Link
            href="/home"
            className="shrink-0 px-2 text-sm font-semibold text-foreground"
          >
            <Image
              src="/images/logo.png"
              alt="PokeMartech"
              width={100}
              height={100}
            />
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                active={link.active}
                target={link.target}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className={cn("ml-auto flex items-center gap-2")}>
            <div className="flex items-center rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-amber-600">
              {profile.data ? (
                `${profile.data.coins} moedas`
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
              <Coins className="ml-1 size-5 text-amber-600" />
            </div>
            <Button
              size="sm"
              onClick={() => {
                void authClient.signOut().then(() => {
                  router.push("/entrar");
                  router.refresh();
                });
              }}
            >
              Sair
            </Button>
          </div>
        </div>
        <nav className="glass pointer-events-auto mx-auto mt-2 flex max-w-5xl items-center justify-center gap-1 rounded-full px-2 py-1.5 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              active={link.active}
              target={link.target}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main
        className={cn(
          arenaLayout
            ? "fixed inset-x-0 bottom-0 overflow-hidden"
            : "mx-auto w-full max-w-6xl px-4 pb-12 pt-36 md:pt-24",
        )}
        style={arenaLayout ? { top: headerHeight } : undefined}
      >
        {children}
      </main>
    </div>
  );
}

export { AppShell };
