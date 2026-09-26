import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findEnvVar } from "@/lib/cashfree";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const appId = findEnvVar([
      "CASHFREE_APP_ID",
      "NEXT_PUBLIC_CASHFREE_APP_ID",
      "CASHFREE_CLIENT_ID",
      "CF_APP_ID",
      "CASHFREE_ID",
      "APP_ID",
    ]);
    const secretKey = findEnvVar([
      "CASHFREE_SECRET_KEY",
      "CASHFREE_SECRET",
      "CASHFREE_API_KEY",
      "CF_SECRET_KEY",
      "CF_SECRET",
      "CASHFREE_KEY",
    ]);

    const safeKeys = Object.keys(process.env)
      .filter(
        (k) =>
          !k.toUpperCase().includes("SECRET") &&
          !k.toUpperCase().includes("TOKEN") &&
          !k.toUpperCase().includes("PASSWORD") &&
          !k.toUpperCase().includes("PRIVATE")
      )
      .sort();

    return NextResponse.json({
      status: "healthy",
      service: "pairfect-api",
      version: "1.0.4",
      vercel_project_name: process.env.VERCEL_PROJECT_NAME || "unknown",
      cashfree_configured: {
        has_app_id: !!appId,
        has_secret: !!secretKey,
        env: process.env.CASHFREE_ENV || "not_set",
        safe_keys: safeKeys,
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
