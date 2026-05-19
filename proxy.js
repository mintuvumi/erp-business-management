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
  "/engineering-offers",
];

const authRoutes = ["/login", "/register"];

export function proxy(req) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("erp_token")?.value;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    const loginUrl = req.nextUrl.clone();

    loginUrl.pathname = "/login";

    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    const dashboardUrl = req.nextUrl.clone();

    dashboardUrl.pathname = "/dashboard";

    return NextResponse.redirect(dashboardUrl);
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
    "/engineering-offers/:path*",
    "/login",
    "/register",
  ],
};