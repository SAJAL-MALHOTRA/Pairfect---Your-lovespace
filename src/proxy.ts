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

  const isProtectedRoute =
    path.startsWith("/dashboard") ||
    path.startsWith("/checkin") ||
    path.startsWith("/history") ||
    path.startsWith("/recap") ||
    path.startsWith("/moments") ||
    path.startsWith("/love-letter") ||
    path.startsWith("/gratitude-jar") ||
    path.startsWith("/stories") ||
    path.startsWith("/watch") ||
    path.startsWith("/play") ||
    path.startsWith("/match-game") ||
    path.startsWith("/settings") ||
    path.startsWith("/profile") ||
    path.startsWith("/photo-booth") ||
    path.startsWith("/riddle") ||
    path.startsWith("/iq-duel") ||
    path.startsWith("/vibe-judge") ||
    path.startsWith("/mixtape") ||
    path.startsWith("/focus") ||
    path.startsWith("/calendar") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/quiz") ||
    path.startsWith("/avatars");

  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");

  // Fast-exit for public pages without incurring an external auth network roundtrip
  if (!isProtectedRoute && !isAuthRoute) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default proxy;
