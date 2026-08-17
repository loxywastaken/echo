import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

// Lightweight edge gate: it only checks for the *presence* of a session cookie
// (real validation happens in server components / route handlers against the
// database). This keeps unauthenticated users out of the app shell and keeps
// logged-in users out of the auth screens without a DB call at the edge.

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];
const PUBLIC_PREFIXES = ["/verify-email", "/guidelines", "/api", "/uploads", "/_next"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const hasSession = !!req.cookies.get(SESSION_COOKIE)?.value;
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!hasSession && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (hasSession && isAuthPage) {
    // Allow accessing /login?add=1 while logged in (adding another account)
    const isAddAccount = pathname === "/login" && req.nextUrl.searchParams.get("add") === "1";
    if (!isAddAccount) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
