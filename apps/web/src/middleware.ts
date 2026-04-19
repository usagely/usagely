import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED_PATHS = [
  "/dashboard",
  "/teams",
  "/people",
  "/tools",
  "/models",
  "/budgets",
  "/anomalies",
  "/settings",
  "/profile",
  "/recommendations",
  "/shadow",
  "/approvals",
  "/forecast",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  if (!isProtected) {
    return NextResponse.next()
  }

  if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") {
    return NextResponse.next()
  }

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token")

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
