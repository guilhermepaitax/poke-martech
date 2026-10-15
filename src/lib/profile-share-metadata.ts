import { profileNames, profileShareDescription, profileSharePath } from "@/lib/profile-share";
import type { ProfilePreview } from "@/types/catalog";
import type { Metadata } from "next";

const FALLBACK_IMAGE = {
  url: "/landing-page/banner.png",
  width: 1672,
  height: 941,
} as const;

function profileShareMetadata(profile: ProfilePreview): Metadata {
  const title = `${profile.name} (@${profile.username})`;
  const description = profileShareDescription(profile);
  const url = profileSharePath(profile.username);
  const names = profileNames(profile.name);
  const images = profile.image
    ? [{ url: profile.image, alt: profile.name }]
    : [{ ...FALLBACK_IMAGE, alt: profile.name }];

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "profile",
      locale: "pt_BR",
      siteName: "PokeMartech",
      title,
      description,
      url,
      images,
      username: profile.username,
      firstName: names.firstName,
      lastName: names.lastName,
    },
    twitter: {
      card: profile.image ? "summary" : "summary_large_image",
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export { profileShareMetadata };
