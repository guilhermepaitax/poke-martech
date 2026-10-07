import { PublicProfile } from "@/components/public-profile/public-profile";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <PublicProfile username={username} />;
}
