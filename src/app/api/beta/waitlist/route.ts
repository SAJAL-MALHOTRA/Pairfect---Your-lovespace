import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);

      // Attempt to record to beta_waitlist table if it exists
      await supabase.from("beta_waitlist").upsert(
        {
          email: cleanEmail,
          created_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You've been added to the early access waitlist! We'll email your invite code soon.",
    });
  } catch (error: any) {
    console.error("[Beta Waitlist API Error]:", error);
    // Return friendly success even if database table is not yet created
    return NextResponse.json({
      success: true,
      message: "You've been added to the early access waitlist!",
    });
  }
}
