import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;
  const isSharedLetter = path.startsWith("/love-letter") && (request.nextUrl.searchParams.has("id") || request.nextUrl.searchParams.has("share"));

  const isProtectedRoute = !isSharedLetter && (
    path.startsWith("/dashboard") ||
    path.startsWith("/checkin") ||
    path.startsWith("/history") ||
    path.startsWith("/recap") ||
    path.startsWith("/moments") ||
    path.startsWith("/love-letter") ||
    path.startsWith("/gratitude-jar") ||
    path.startsWith("/stories") ||
    path.startsWith("/play") ||
    path.startsWith("/match-game") ||
    path.startsWith("/settings") ||
    path.startsWith("/profile") ||
    path.startsWith("/riddle") ||
    path.startsWith("/iq-duel") ||
    path.startsWith("/vibe-judge") ||
    path.startsWith("/focus") ||
    path.startsWith("/calendar") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/quiz") ||
    path.startsWith("/avatars")
  );

  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");
  const isLandingPage = path === "/";

  // Fast-exit for public pages without incurring an external auth network roundtrip
  if (!isProtectedRoute && !isAuthRoute && !isLandingPage) {
    return supabaseResponse;
  }

  // Only check auth if there's a Supabase session cookie present (avoid unnecessary roundtrips)
  const hasSessionCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // Landing page: if no session cookie, fast-exit (serve static page from CDN)
  if (isLandingPage && !hasSessionCookie) {
    return supabaseResponse;
  }

  // Only call getUser() when we actually need to check auth
  if (!hasSessionCookie && !isProtectedRoute) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Landing page: logged-in users get redirected to dashboard
  if (isLandingPage && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    const safeRedirect =
      redirectParam &&
      redirectParam.startsWith("/") &&
      !redirectParam.startsWith("//") &&
      !redirectParam.includes("://") &&
      !redirectParam.includes("\\")
        ? redirectParam
        : "/dashboard";
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default proxy;
