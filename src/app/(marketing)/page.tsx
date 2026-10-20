import { Landing } from "@/components/landing/landing";
import { getServerSession } from "@/lib/server-session";

export default async function LandingPage() {
  const session = await getServerSession();
  return <Landing signedIn={Boolean(session)} />;
}
