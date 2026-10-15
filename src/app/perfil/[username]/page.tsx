import { profileShareDescription, profileSharePath } from "@/lib/profile-share";
import { profileShareMetadata } from "@/lib/profile-share-metadata";
import { siteOrigin } from "@/lib/site-metadata";
import { container } from "@/server/container";
import type { ProfilePreview } from "@/types/catalog";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";

const loadPreview = cache((username: string) =>
  container.getProfilePreview.execute({ username }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const result = await loadPreview(username);
  if (!result.ok) return { title: "Treinador não encontrado", robots: { index: false, follow: false } };
  return profileShareMetadata(result.value);
}

function previewJsonLd(profile: ProfilePreview) {
  const url = new URL(profileSharePath(profile.username), siteOrigin()).toString();
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      alternateName: `@${profile.username}`,
      description: profileShareDescription(profile),
      image: profile.image ?? undefined,
      url,
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/FollowAction",
          userInteractionCount: profile.followerCount,
        },
      ],
    },
  };
}

export default async function ProfilePreviewPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const result = await loadPreview(username);
  if (!result.ok) notFound();
  const profile = result.value;
  const followers =
    profile.followerCount === 1 ? "1 seguidor" : `${profile.followerCount} seguidores`;
  const following = `${profile.followingCount} seguindo`;

  return (
    <main
      data-slot="profile-preview"
      className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-6 py-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(previewJsonLd(profile)).replace(/</g, "\\u003c"),
        }}
      />
      <p className="text-sm text-foreground-subtle">PokeMartech</p>
      {profile.image ? (
        <Image
          src={profile.image}
          alt={profile.name}
          width={96}
          height={96}
          priority
          className="size-24 rounded-full object-cover"
        />
      ) : null}
      <h1 className="text-4xl font-semibold tracking-tight">{profile.name}</h1>
      <p className="text-lg text-foreground-subtle">@{profile.username}</p>
      {profile.bio ? <p className="max-w-prose text-base leading-relaxed">{profile.bio}</p> : null}
      <p className="text-sm text-foreground-subtle">
        {followers} e {following}
      </p>
    </main>
  );
}
