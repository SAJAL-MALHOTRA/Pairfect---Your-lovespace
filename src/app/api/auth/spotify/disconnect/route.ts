import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const baseUrl = new URL(request.url).origin;
  const settingsUrl = `${baseUrl}/settings`;

  try {
    // 1. Get logged-in user from Supabase session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Supabase user session invalid during disconnect:", authError);
      return NextResponse.redirect(`${settingsUrl}?error=unauthorized`);
    }

    const adminSupabase = createAdminClient();

    // 2. Delete secret row from user_secrets
    const { error: deleteSecretErr } = await adminSupabase
      .from("user_secrets")
      .delete()
      .eq("user_id", user.id);

    if (deleteSecretErr) {
      console.error("Failed to delete Spotify secret token:", deleteSecretErr);
      return NextResponse.redirect(`${settingsUrl}?error=secrets_db_delete_failed`);
    }

    // 3. Update spotify_connected to false in users profile table
    const { error: updateProfileErr } = await adminSupabase
      .from("users")
      .update({ spotify_connected: false })
      .eq("id", user.id);

    if (updateProfileErr) {
      console.error("Failed to clear Spotify connection state on user profile:", updateProfileErr);
      return NextResponse.redirect(`${settingsUrl}?error=profile_db_disconnect_failed`);
    }

    return NextResponse.redirect(`${settingsUrl}?spotify=disconnected`);
  } catch (err: any) {
    console.error("Spotify disconnect unexpected error:", err);
    return NextResponse.redirect(`${settingsUrl}?error=${encodeURIComponent(err.message || "unexpected")}`);
  }
}
export const dynamic = "force-dynamic";
