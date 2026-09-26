import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("users").select("count", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { status: "degraded", error: error.message, timestamp },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      service: "pairfect-api",
      version: "1.0.1",
      commit: "d88b6eb",
      cashfree_configured: {
        has_app_id: !!(process.env.CASHFREE_APP_ID || process.env.NEXT_PUBLIC_CASHFREE_APP_ID),
        has_secret: !!(process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_SECRET),
        env: process.env.CASHFREE_ENV || "not_set",
      },
      timestamp,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "unhealthy", error: err.message || "Server Error", timestamp },
      { status: 500 }
    );
  }
}
