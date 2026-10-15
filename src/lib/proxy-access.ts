import {
  isShareCrawler,
  loginPath,
  previewUsernameFromPath,
  profilePreviewPath,
  profileSharePath,
  profileUsernameFromPath,
  safeCallbackUrl,
} from "@/lib/profile-share";

const authPaths = new Set(["/entrar", "/cadastrar"]);

type ProxyDecision =
  | { type: "next" }
  | { type: "next-with-path" }
  | { type: "redirect"; path: string }
  | { type: "rewrite"; pathname: string };

function resolveProxyAccess(input: {
  pathname: string;
  userAgent: string | null;
  hasSession: boolean;
  callbackUrl: string | null;
  search: string;
}): ProxyDecision {
  const previewUsername = previewUsernameFromPath(input.pathname);
  if (previewUsername) {
    const destination = profileSharePath(previewUsername);
    if (isShareCrawler(input.userAgent)) return { type: "next" };
    if (!input.hasSession) return { type: "redirect", path: loginPath(destination) };
    return { type: "redirect", path: destination };
  }

  if (authPaths.has(input.pathname)) {
    if (!input.hasSession) return { type: "next" };
    const callback = safeCallbackUrl(input.callbackUrl);
    return { type: "redirect", path: callback ?? "/home" };
  }

  if (input.pathname === "/") return { type: "next" };

  const username = profileUsernameFromPath(input.pathname);
  if (!input.hasSession) {
    if (username && isShareCrawler(input.userAgent)) {
      return { type: "rewrite", pathname: profilePreviewPath(username) };
    }
    if (username) {
      const callback = safeCallbackUrl(input.pathname + input.search) ?? `/u/${username}`;
      return { type: "redirect", path: loginPath(callback) };
    }
    return { type: "redirect", path: "/entrar" };
  }

  return { type: "next-with-path" };
}

export { resolveProxyAccess };
export type { ProxyDecision };
