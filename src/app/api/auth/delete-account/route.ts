import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (adminInitErr) {
      console.error("[DeleteAccount] Admin client init failed:", adminInitErr);
      return NextResponse.json(
        { error: "Server configuration error: Service role credentials missing" },
        { status: 500 }
      );
    }

    // 1. Clear any foreign key references where ON DELETE CASCADE is missing
    try {
      await adminClient
        .from("pairs")
        .update({ purge_requested_by: null })
        .eq("purge_requested_by", user.id);
    } catch (clearErr) {
      console.warn("[DeleteAccount] Clear purge_requested_by warning:", clearErr);
    }

    // 2. Fetch all pairs user belongs to (pending or active or unlinked)
    const { data: pairsList, error: pairErr } = await adminClient
      .from("pairs")
      .select("id, user_a_id, user_b_id, status")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

    if (pairErr) {
      console.warn("[DeleteAccount] Error querying pairs:", pairErr);
    }

    if (pairsList && pairsList.length > 0) {
      for (const p of pairsList) {
        const isUserA = p.user_a_id === user.id;
        const otherUserId = isUserA ? p.user_b_id : p.user_a_id;

        if (!otherUserId) {
          // Sole user in pair: purge storage files and delete the entire pair
          try {
            const { data: stripFolders } = await adminClient.storage.from("memories").list(`${p.id}/strips`);
            if (stripFolders && stripFolders.length > 0) {
              for (const folder of stripFolders) {
                const { data: stripFiles } = await adminClient.storage
                  .from("memories")
                  .list(`${p.id}/strips/${folder.name}`);
                if (stripFiles && stripFiles.length > 0) {
                  const paths = stripFiles.map((f: { name: string }) => `${p.id}/strips/${folder.name}/${f.name}`);
                  await adminClient.storage.from("memories").remove(paths);
                }
              }
            }
            const { data: rootFiles } = await adminClient.storage.from("memories").list(p.id);
            if (rootFiles && rootFiles.length > 0) {
              const rootPaths = rootFiles.map((f: { name: string }) => `${p.id}/${f.name}`);
              await adminClient.storage.from("memories").remove(rootPaths);
            }
          } catch (storageCleanupErr) {
            console.warn("[DeleteAccount] Storage cleanup warning:", storageCleanupErr);
          }

          // Delete the pair row (cascades to all associated shared content)
          await adminClient.from("pairs").delete().eq("id", p.id);
        } else {
          // Partner still exists: decouple gracefully without destroying partner account
          if (isUserA) {
            // Promote user B to user A slot and mark unlinked
            await adminClient
              .from("pairs")
              .update({
                user_a_id: otherUserId,
                user_b_id: null,
                status: "unlinked",
              })
              .eq("id", p.id);
          } else {
            // User B is deleting: remove B from slot and mark unlinked
            await adminClient
              .from("pairs")
              .update({
                user_b_id: null,
                status: "unlinked",
              })
              .eq("id", p.id);
          }
        }
      }
    }

    // 3. Remove user avatars from storage
    try {
      await adminClient.storage.from("avatars").remove([
        `${user.id}`,
        `${user.id}.png`,
        `${user.id}.jpg`,
        `${user.id}.webp`,
      ]);
    } catch (avatarErr) {
      console.warn("[DeleteAccount] Avatar removal warning:", avatarErr);
    }

    // 4. Delete the user from auth.users (cascades to public.users and all user-owned rows)
    const { error: deleteUserErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteUserErr) {
      console.error("[DeleteAccount] Failed to delete auth user:", deleteUserErr);
      return NextResponse.json(
        { error: deleteUserErr.message || "Failed to delete user account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[DeleteAccount] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to delete account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
