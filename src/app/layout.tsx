import { Providers } from "@/components/providers/providers";
import { readFeatureFlags } from "@/lib/feature-flags.server";
import { siteMetadata } from "@/lib/site-metadata";
import { trackFeatureFlags } from "@/lib/track-feature-flags";
import { Sora } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata = siteMetadata;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const featureFlags = await readFeatureFlags();
  trackFeatureFlags(featureFlags);

  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -left-30 top-10 size-150 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-25 -bottom-50 size-150 rounded-full bg-energy-water/25 blur-3xl" />
        </div>
        <Providers featureFlags={featureFlags}>{children}</Providers>
      </body>
    </html>
  );
}
