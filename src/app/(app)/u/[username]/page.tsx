import { redirect } from "next/navigation";
import { PublicProfile } from "@/components/public-profile/public-profile";
import { getServerSession } from "@/lib/server-session";
import { profileShareMetadata } from "@/lib/profile-share-metadata";
import { container } from "@/server/container";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const result = await container.getProfilePreview.execute({ username });
  if (!result.ok) return { title: "Treinador não encontrado" };
  return profileShareMetadata(result.value);
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ seguir?: string }>;
}) {
  const { username } = await params;
  const { seguir } = await searchParams;
  const session = await getServerSession();
  const sessionUsername =
    session?.user && "username" in session.user && typeof session.user.username === "string"
      ? session.user.username.toLowerCase()
      : null;
  if (seguir === "1" && sessionUsername === username.toLowerCase()) {
    redirect(`/u/${username.toLowerCase()}`);
  }
  return (
    <PublicProfile
      key={username}
      username={username}
      inviteFollow={seguir === "1"}
    />
  );
}
