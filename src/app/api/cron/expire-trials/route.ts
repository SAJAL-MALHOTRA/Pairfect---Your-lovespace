import { NextResponse } from "next/server";
import { expireLapsedTrials } from "@/lib/trials";

export const dynamic = "force-dynamic";

/**
 * Daily cron endpoint to sweep and expire lapsed trials back to Free tier.
 * Call via Vercel Cron, external monitoring, or GitHub Actions.
 */
async function handleExpire(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, enforce authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(req.url);
      const queryKey = url.searchParams.get("key");
      if (queryKey !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await expireLapsedTrials();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expiredCouplesCount: result.expiredCount,
      error: result.error || null,
    });
  } catch (err: any) {
    console.error("[api/cron/expire-trials] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleExpire(req);
}

export async function POST(req: Request) {
  return handleExpire(req);
}
