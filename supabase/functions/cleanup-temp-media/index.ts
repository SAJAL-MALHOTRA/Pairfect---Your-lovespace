import { createClient } from "npm:@supabase/supabase-js@2";

const RETENTION_DAYS = 30;
const MEMORIES_BUCKET = "memories";

type SharedMomentRow = { photo_url: string | null };
type SnapHuntEntryRow = { id: string; photo_url: string | null };
type PhotoboothCaptureRow = { id: string; photo_url: string | null };
type PhotoboothStripRow = { id: string; combined_image_url: string | null; saved_to_moments: boolean | null };

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Supabase service credentials are not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: savedMoments, error: momentsErr } = await supabase
    .from("shared_moments")
    .select("photo_url");

  if (momentsErr) {
    return new Response(JSON.stringify({ error: momentsErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const savedPhotoPaths = new Set(
    (savedMoments as SharedMomentRow[] | null | undefined)
      ?.map((row) => row.photo_url)
      .filter((value): value is string => Boolean(value))
  );

  const { data: snapEntries, error: snapErr } = await supabase
    .from("snap_hunt_entries")
    .select("id,photo_url")
    .lt("submitted_at", cutoff);

  if (snapErr) {
    return new Response(JSON.stringify({ error: snapErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const { data: captureRows, error: capturesErr } = await supabase
    .from("photobooth_captures")
    .select("id,photo_url")
    .lt("captured_at", cutoff);

  if (capturesErr) {
    return new Response(JSON.stringify({ error: capturesErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const { data: stripRows, error: stripsErr } = await supabase
    .from("photobooth_strips")
    .select("id,combined_image_url,saved_to_moments")
    .lt("created_at", cutoff)
    .eq("saved_to_moments", false);

  if (stripsErr) {
    return new Response(JSON.stringify({ error: stripsErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const pathsToDelete = new Set<string>();
  const snapEntriesToDelete: string[] = [];
  const captureIdsToDelete: string[] = [];
  const stripIdsToDelete: string[] = [];

  for (const row of (snapEntries || []) as SnapHuntEntryRow[]) {
    if (row.photo_url && !savedPhotoPaths.has(row.photo_url)) {
      pathsToDelete.add(row.photo_url);
      snapEntriesToDelete.push(row.id);
    }
  }

  for (const row of (captureRows || []) as PhotoboothCaptureRow[]) {
    if (row.photo_url) {
      pathsToDelete.add(row.photo_url);
      captureIdsToDelete.push(row.id);
    }
  }

  for (const row of (stripRows || []) as PhotoboothStripRow[]) {
    if (row.combined_image_url && row.saved_to_moments !== true && !savedPhotoPaths.has(row.combined_image_url)) {
      pathsToDelete.add(row.combined_image_url);
      stripIdsToDelete.push(row.id);
    }
  }

  let storageDeletes = 0;
  for (const path of pathsToDelete) {
    const { error } = await supabase.storage.from(MEMORIES_BUCKET).remove([path]);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
    storageDeletes += 1;
  }

  if (snapEntriesToDelete.length > 0) {
    const { error } = await supabase.from("snap_hunt_entries").delete().in("id", snapEntriesToDelete);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }

  if (captureIdsToDelete.length > 0) {
    const { error } = await supabase.from("photobooth_captures").delete().in("id", captureIdsToDelete);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }

  if (stripIdsToDelete.length > 0) {
    const { error } = await supabase.from("photobooth_strips").delete().in("id", stripIdsToDelete);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      cutoff,
      storageDeletes,
      snapEntriesDeleted: snapEntriesToDelete.length,
      capturesDeleted: captureIdsToDelete.length,
      stripsDeleted: stripIdsToDelete.length,
    }),
    { headers: { "content-type": "application/json" } }
  );
});
