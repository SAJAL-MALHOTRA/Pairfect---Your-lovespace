import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingContent from "@/components/landing-content";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect straight to dashboard or onboarding
  if (user) {
    const { data: pair } = await supabase
      .from("pairs")
      .select("id, status")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (pair) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return <LandingContent />;
}
