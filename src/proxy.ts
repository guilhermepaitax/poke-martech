import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const authPaths = new Set(["/entrar", "/cadastrar"]);

function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/monitoring")) {
    return NextResponse.next();
  }

  const hasSession = Boolean(getSessionCookie(request));

  if (authPaths.has(pathname)) {
    if (hasSession) return NextResponse.redirect(new URL("/home", request.url));
    return NextResponse.next();
  }

  if (pathname === "/") return NextResponse.next();

  if (!hasSession)
    return NextResponse.redirect(new URL("/entrar", request.url));
  return NextResponse.next();
}

export { proxy };

export const config = {
  matcher: ["/((?!_next/static|images|_next/image|favicon.ico|monitoring|.*\\..*).*)"],
};
