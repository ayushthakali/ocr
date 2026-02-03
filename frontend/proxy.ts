import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  const { pathname } = req.nextUrl;

  if (token && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  // Redirect logged-out users away from protected pages
  const protectedRoutes = ["/chat", "/upload", "/gallery", "/settings"];
  if (!token && protectedRoutes.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth",
    "/chat/:path*",
    "/upload/:path*",
    "/gallery/:path*",
    "/settings/:path*",
  ],
};
