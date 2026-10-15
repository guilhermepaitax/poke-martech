import { Landing } from "@/components/landing/landing";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <Landing signedIn={Boolean(session)} />;
}
