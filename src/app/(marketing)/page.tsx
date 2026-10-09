import { Landing } from "@/components/landing/landing";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "PokeMartech",
  description:
    "Cartas do time. Abra um pacote, troque e batalhe.",
};

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <Landing signedIn={Boolean(session)} />;
}
