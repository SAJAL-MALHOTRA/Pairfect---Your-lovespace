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
      version: "1.0.0",
      timestamp,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "unhealthy", error: err.message || "Server Error", timestamp },
      { status: 500 }
    );
  }
}
