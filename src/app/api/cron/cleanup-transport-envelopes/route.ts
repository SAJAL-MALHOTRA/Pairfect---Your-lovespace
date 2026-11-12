import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function executeEnvelopeCleanup(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const keyParam = searchParams.get("key");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron Envelope Cleanup] CRON_SECRET is not configured on server.");
      return NextResponse.json(
        { success: false, error: "Cron cleanup is not configured." },
        { status: 503 }
      );
    }

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || keyParam === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized cron trigger." },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // 1. Fetch pending pairs older than 48 hours (uncompleted invites)
    const { data: pendingPairs, error: pendingErr } = await supabase
      .from("pairs")
      .select("id, created_at, status")
      .eq("status", "pending")
      .lt("created_at", cutoff48h);

    if (pendingErr) throw pendingErr;

    // 2. Fetch active pairs older than 48 hours (transport envelope should have been acked)
    const { data: activePairs, error: activeErr } = await supabase
      .from("pairs")
      .select("id, created_at, status")
      .eq("status", "active")
      .lt("created_at", cutoff48h);

    if (activeErr) throw activeErr;

    const LEGACY_TRANSPORT_UNTIL = process.env.LEGACY_TRANSPORT_UNTIL
      ? parseInt(process.env.LEGACY_TRANSPORT_UNTIL, 10)
      : Date.parse("2026-11-20T00:00:00Z");

    const shouldPruneLegacy = Date.now() >= LEGACY_TRANSPORT_UNTIL;

    const transportPathsToDelete: string[] = [];
    const legacyPathsToDelete: string[] = [];

    // Add transport envelope paths for pending pairs older than 48h
    for (const pair of pendingPairs || []) {
      transportPathsToDelete.push(`${pair.id}/transport-envelope.json`);
      if (shouldPruneLegacy) {
        legacyPathsToDelete.push(`${pair.id}/vault-envelope.json`);
      }
    }

    // Add transport envelope paths for active pairs older than 48h
    for (const pair of activePairs || []) {
      transportPathsToDelete.push(`${pair.id}/transport-envelope.json`);
      if (shouldPruneLegacy) {
        legacyPathsToDelete.push(`${pair.id}/vault-envelope.json`);
      }
    }

    let deletedTransportCount = 0;
    let deletedLegacyCount = 0;

    // Batch prune transport envelopes (chunks of 50)
    for (let i = 0; i < transportPathsToDelete.length; i += 50) {
      const chunk = transportPathsToDelete.slice(i, i + 50);
      const { data, error } = await supabase.storage.from("memories").remove(chunk);
      if (!error && data) {
        deletedTransportCount += data.length;
      }
    }

    // Batch prune legacy vault envelopes if beyond cutoff date
    if (shouldPruneLegacy && legacyPathsToDelete.length > 0) {
      for (let i = 0; i < legacyPathsToDelete.length; i += 50) {
        const chunk = legacyPathsToDelete.slice(i, i + 50);
        const { data, error } = await supabase.storage.from("memories").remove(chunk);
        if (!error && data) {
          deletedLegacyCount += data.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        pendingPairsExamined: pendingPairs?.length || 0,
        activePairsExamined: activePairs?.length || 0,
        transportEnvelopesPruned: deletedTransportCount,
        legacyEnvelopesPruned: deletedLegacyCount,
        pruneLegacyEnabled: shouldPruneLegacy,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("[Cron Envelope Cleanup] Execution error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return executeEnvelopeCleanup(request);
}

export async function POST(request: Request) {
  return executeEnvelopeCleanup(request);
}
