import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingContent from "@/components/landing-content";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect straight to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}
