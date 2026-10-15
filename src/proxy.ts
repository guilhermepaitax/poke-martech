import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { resolveProxyAccess } from "@/lib/proxy-access";

function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/monitoring")) {
    return NextResponse.next();
  }

  const decision = resolveProxyAccess({
    pathname,
    search,
    userAgent: request.headers.get("user-agent"),
    hasSession: Boolean(getSessionCookie(request)),
    callbackUrl: request.nextUrl.searchParams.get("callbackUrl"),
  });

  if (decision.type === "redirect") {
    return NextResponse.redirect(new URL(decision.path, request.url));
  }
  if (decision.type === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = decision.pathname;
    url.search = "";
    return NextResponse.rewrite(url);
  }
  if (decision.type === "next-with-path") {
    const headers = new Headers(request.headers);
    headers.set("x-pathname", pathname + search);
    return NextResponse.next({ request: { headers } });
  }
  return NextResponse.next();
}

export { proxy };

export const config = {
  matcher: ["/((?!_next/static|images|_next/image|favicon.ico|monitoring|.*\\..*).*)"],
};
