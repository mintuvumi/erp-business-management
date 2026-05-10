import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/accounts",
  "/purchase",
  "/sales",
  "/stock",
  "/inventory",
  "/bank",
  "/suppliers",
  "/customers",
  "/employee",
  "/reports",
  "/settings",
];

const authRoutes = ["/login", "/register"];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("erp_token")?.value;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/purchase/:path*",
    "/sales/:path*",
    "/stock/:path*",
    "/inventory/:path*",
    "/bank/:path*",
    "/suppliers/:path*",
    "/customers/:path*",
    "/employee/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};