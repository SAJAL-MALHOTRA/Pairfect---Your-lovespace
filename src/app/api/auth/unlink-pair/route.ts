import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolveAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      try {
        const admin = createAdminClient();
        const { data: { user }, error } = await admin.auth.getUser(token);
        if (!error && user) return user;
      } catch (e) {
        console.warn("[Unlink API] Bearer token auth error:", e);
      }
    }
  }

  try {
    const sessionSupabase = await createClient();
    const { data: { user } } = await sessionSupabase.auth.getUser();
    return user || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const user = await resolveAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbClient = createAdminClient();

    const { data: pairsList, error: pairErr } = await dbClient
      .from("pairs")
      .select("id,user_a_id,user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .in("status", ["pending", "active"]);

    if (pairErr) throw pairErr;

    if (!pairsList || pairsList.length === 0) {
      return NextResponse.json({ success: true });
    }

    for (const p of pairsList) {
      // 1. Clean up encrypted files in memories bucket for this pair
      try {
        const { data: stripFolders } = await dbClient.storage.from("memories").list(`${p.id}/strips`);
        if (stripFolders && stripFolders.length > 0) {
          for (const folder of stripFolders) {
            const { data: stripFiles } = await dbClient.storage.from("memories").list(`${p.id}/strips/${folder.name}`);
            if (stripFiles && stripFiles.length > 0) {
              const paths = stripFiles.map((f: any) => `${p.id}/strips/${folder.name}/${f.name}`);
              await dbClient.storage.from("memories").remove(paths);
            }
          }
        }
        const { data: rootFiles } = await dbClient.storage.from("memories").list(p.id);
        if (rootFiles && rootFiles.length > 0) {
          const rootPaths = rootFiles.map((f: any) => `${p.id}/${f.name}`);
          await dbClient.storage.from("memories").remove(rootPaths);
        }
      } catch (storageCleanupErr) {
        console.warn("[Unlink] Storage cleanup warning:", storageCleanupErr);
      }

      // 2. Try calling the SECURITY DEFINER RPC first
      const { data: rpcData, error: rpcErr } = await dbClient.rpc("unlink_and_delete_pair", { p_pair_id: p.id });

      if (rpcErr || !rpcData?.success) {
        // Fallback: Delete pair row
        await dbClient.from("pairs").delete().eq("id", p.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Unlink pair error:", err);
    const message = err instanceof Error ? err.message : "Failed to unlink pair";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
