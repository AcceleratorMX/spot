import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const intlMiddleware = createIntlMiddleware(routing);

const publicPages = ["/", "/sign-in", "/sign-up"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Strip locale prefix for matching (e.g., /uk/sign-in -> /sign-in)
  const pathnameWithoutLocale = routing.locales.reduce(
    (path, locale) =>
      path.startsWith(`/${locale}/`) || path === `/${locale}`
        ? path.replace(`/${locale}`, "") || "/"
        : path,
    pathname,
  );

  const isPublicPage = publicPages.includes(pathnameWithoutLocale);
  const isApiRoute = pathname.startsWith("/api");
  const isAuthRoute = pathname.startsWith("/api/auth");

  // Always allow Auth.js API routes
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Skip intl middleware for other API routes
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Apply intl middleware for all pages
  const intlResponse = intlMiddleware(req);

  // If user is not authenticated and page is private, redirect to sign-in
  if (!req.auth && !isPublicPage) {
    const locale = pathname.split("/")[1] || routing.defaultLocale;
    const signInUrl = new URL(`/${locale}/sign-in`, req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return intlResponse;
});

export const config = {
  matcher: ["/", "/(uk|en)/:path*", "/api/:path*"],
};
