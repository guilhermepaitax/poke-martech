import { Bricolage_Grotesque } from "next/font/google";
import type { ReactNode } from "react";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      data-slot="marketing-layout"
      className={`${display.variable} min-h-dvh bg-landing-dusk text-landing-paper`}
    >
      {children}
    </div>
  );
}
