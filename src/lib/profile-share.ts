import { USERNAME_PATTERN } from "@/lib/auth-form-errors";

const SHARE_CRAWLER =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|slackbot|slack-imgproxy|telegrambot|discordbot|pinterest|googlebot|google-inspectiontool|bingbot|bingpreview|applebot|redditbot|embedly|iframely|quora link preview|vkshare|duckduckbot|bitlybot|nuzzel|mastodon|skypeuripreview|microsoftpreview|yandexbot|baiduspider|ia_archiver|w3c_validator|flipboard|tumblr|viber|kakaotalk|bluesky|cardyb|\bline\//i;

function profileSharePath(username: string) {
  return `/u/${username}?seguir=1`;
}

function profilePreviewPath(username: string) {
  return `/perfil/${username}`;
}

function loginPath(callbackUrl: string) {
  return `/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

function readUsername(pathname: string, prefix: "/u" | "/perfil") {
  if (!pathname.startsWith(`${prefix}/`)) return null;
  const rest = pathname.slice(prefix.length + 1);
  if (!rest || rest.includes("/")) return null;
  let username: string;
  try {
    username = decodeURIComponent(rest).toLowerCase();
  } catch {
    return null;
  }
  if (!USERNAME_PATTERN.test(username)) return null;
  return username;
}

function profileUsernameFromPath(pathname: string) {
  return readUsername(pathname, "/u");
}

function previewUsernameFromPath(pathname: string) {
  return readUsername(pathname, "/perfil");
}

function isShareCrawler(userAgent: string | null) {
  if (!userAgent) return false;
  return SHARE_CRAWLER.test(userAgent);
}

function safeProfilePath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("\0")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(value, "http://local");
  } catch {
    return null;
  }
  if (url.origin !== "http://local") return null;
  const username = profileUsernameFromPath(url.pathname);
  if (!username) return null;
  const keys = [...url.searchParams.keys()];
  if (keys.length === 0) return `/u/${username}`;
  if (keys.length === 1 && url.searchParams.get("seguir") === "1") return profileSharePath(username);
  return null;
}

function safeCallbackUrl(value: string | null) {
  if (!value) return null;
  const direct = safeProfilePath(value);
  if (direct) return direct;
  try {
    return safeProfilePath(decodeURIComponent(value));
  } catch {
    return null;
  }
}

function profileShareDescription(profile: {
  name: string;
  bio: string;
  followerCount: number;
}) {
  const followers =
    profile.followerCount === 1 ? "1 seguidor" : `${profile.followerCount} seguidores`;
  const intro = profile.bio.trim()
    ? profile.bio.trim()
    : `${profile.name} coleciona e troca cartas no PokeMartech.`;
  const text = `${intro} ${followers}.`.replace(/\s+/g, " ").trim();
  if (text.length <= 200) return text;
  return `${text.slice(0, 199).trimEnd()}…`;
}

function profileNames(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? name,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  };
}

export {
  isShareCrawler,
  loginPath,
  previewUsernameFromPath,
  profileNames,
  profilePreviewPath,
  profileShareDescription,
  profileSharePath,
  profileUsernameFromPath,
  safeCallbackUrl,
};
