import { formatBaseUrl } from "@/lib/format-base-url";
import type { Metadata } from "next";

const SITE_NAME = "PokeMartech";
const SITE_TITLE = "PokeMartech — Comece sua coleção";
const SITE_DESCRIPTION =
  "Abra pacotes para começar a colecionar e troque com o time.";

const OG_IMAGE = {
  url: "/landing-page/banner.png",
  width: 1672,
  height: 941,
  alt: "Quatro criaturas do time em um penhasco ao pôr do sol.",
} as const;

function siteOrigin() {
  return (
    formatBaseUrl(process.env.BETTER_AUTH_URL || "") ||
    formatBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL || "") ||
    formatBaseUrl(process.env.VERCEL_URL || "") ||
    "http://localhost:3000"
  );
}

const siteMetadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export { siteMetadata, siteOrigin };
