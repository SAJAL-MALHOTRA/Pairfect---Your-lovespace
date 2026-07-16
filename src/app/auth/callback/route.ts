import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
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

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error query parameter if code exchange fails
  return NextResponse.redirect(`${origin}/login?error=Could not exchange code for session`);
}
