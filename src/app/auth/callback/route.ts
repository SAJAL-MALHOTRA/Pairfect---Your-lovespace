import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { isBetaModeEnabled, isValidBetaCode, isEmailWhitelisted } from "@/lib/beta";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";

  // Prevent Open Redirect attacks: ensure 'next' is strictly an internal relative path
  const safeNext =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
      ? rawNext
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      const email = user.email?.toLowerCase() || "";

      // ── Private Beta Gate for OAuth Logins ─────────────────────────────────
      if (isBetaModeEnabled()) {
        const cookieStore = await cookies();
        const betaCookie = cookieStore.get("pairfect_beta_code")?.value || "";

        // Check if user already has an established profile or pair
        const { data: existingProfile } = await supabase
          .from("users")
          .select("id, created_at, display_name")
          .eq("id", user.id)
          .maybeSingle();

        const { data: existingPair } = await supabase
          .from("pairs")
          .select("id")
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
          .maybeSingle();

        const isEstablishedUser = !!existingPair || (!!existingProfile && existingProfile.display_name);
        const hasValidBetaAccess =
          isValidBetaCode(betaCookie) ||
          isValidBetaCode(user.user_metadata?.beta_code) ||
          isEmailWhitelisted(email);

        // If this is a brand-new user with no established account and no valid beta code/whitelist
        if (!isEstablishedUser && !hasValidBetaAccess) {
          // Invalidate session
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}/signup?error=A valid Beta Invite Code is required to join our private testing.`
          );
        }
      }

      // 1. Check user profile display name
      const { data: profile } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();

      // 2. Check if they belong to a pair
      const { data: pair } = await supabase
        .from("pairs")
        .select("id, status")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .maybeSingle();

      // 3. Redirect to onboarding if display_name is missing or pair is not active yet
      if (!profile?.display_name || !pair || pair.status !== "active") {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return to login with safe error message if code exchange fails
  return NextResponse.redirect(`${origin}/login?error=Authentication session expired. Please sign in again.`);
}
