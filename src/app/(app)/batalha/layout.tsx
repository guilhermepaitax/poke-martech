import { FeatureUnavailable } from "@/components/feature-flags/feature-unavailable";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { isFeatureEnabled } from "@/lib/feature-flags.server";
import { Press_Start_2P, Rubik } from "next/font/google";

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

const title = Rubik({
  variable: "--font-title",
  weight: "900",
  style: "italic",
  subsets: ["latin"],
});

export default async function BatalhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isFeatureEnabled(FEATURE_FLAGS.arena))) {
    return <FeatureUnavailable title="Arena" />;
  }

  return (
    <div className={`${pixel.variable} ${title.variable} contents`}>
      {children}
    </div>
  );
}
