import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // This endpoint permanently deletes storage objects and records, so it must
    // never be reachable unless a cron secret has been configured.
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("Cron cleanup invoked without CRON_SECRET configured.");
      return NextResponse.json({ error: "Cron cleanup is not configured" }, { status: 503 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Calculate cutoff timestamp (30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffIso = cutoffDate.toISOString();

    // 2. Fetch snap hunt entries older than 30 days
    const { data: oldEntries, error: fetchErr } = await supabase
      .from("snap_hunt_entries")
      .select("id, photo_url, submitted_at")
      .lt("submitted_at", cutoffIso);

    if (fetchErr) throw fetchErr;

    if (!oldEntries || oldEntries.length === 0) {
      return NextResponse.json({ success: true, message: "No expired temporary media found.", deletedCount: 0 });
    }

    // 3. Fetch all photo_urls saved in shared_moments to prevent deleting saved memories
    const { data: savedMoments, error: momentsErr } = await supabase
      .from("shared_moments")
      .select("photo_url")
      .not("photo_url", "is", null);

    if (momentsErr) throw momentsErr;

    const savedPhotoUrls = new Set((savedMoments || []).map((m: any) => m.photo_url));

    // 4. Filter entries that have NOT been explicitly saved to Moments
    const toDeleteEntries = oldEntries.filter((entry: any) => entry.photo_url && !savedPhotoUrls.has(entry.photo_url));
    const pathsToDelete = toDeleteEntries.map((e: any) => e.photo_url);

    if (pathsToDelete.length === 0) {
      return NextResponse.json({ success: true, message: "All expired media was explicitly saved to Moments. None deleted.", deletedCount: 0 });
    }

    // 5. Remove media files from Supabase Storage ("memories" bucket)
    const { data: removeData, error: removeErr } = await supabase
      .storage
      .from("memories")
      .remove(pathsToDelete);

    if (removeErr) {
      console.error("Storage cleanup error:", removeErr);
    }

    // 6. Delete the corresponding snap_hunt_entries database records
    const idsToDelete = toDeleteEntries.map((e: any) => e.id);
    const { error: deleteDbErr } = await supabase
      .from("snap_hunt_entries")
      .delete()
      .in("id", idsToDelete);

    if (deleteDbErr) throw deleteDbErr;

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${pathsToDelete.length} expired temporary photos older than 30 days.`,
      deletedCount: pathsToDelete.length,
      purgedFiles: pathsToDelete
    });
  } catch (err: any) {
    console.error("Cron cleanup error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute media cleanup" }, { status: 500 });
  }
}
