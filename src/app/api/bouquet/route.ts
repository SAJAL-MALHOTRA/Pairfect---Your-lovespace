import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const recipientId = searchParams.get("recipientId");

    if (!id && !recipientId) {
      return NextResponse.json({ error: "Missing bouquet id or recipientId" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // List bouquets by recipient
    if (recipientId) {
      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", recipientId)
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) throw error;

      const bouquetNotifs = (notifs || []).filter(
        (n: any) =>
          n.title?.toLowerCase().includes("bouquet") ||
          n.metadata?.bouquet ||
          n.body?.toLowerCase().includes("bouquet")
      );

      const bouquets = bouquetNotifs.map((n: any) => {
        const bq = n.metadata?.bouquet;
        const senderFallback = n.title?.split(" ")[0] || "Your Partner";
        return {
          id: n.id,
          senderId: n.sender_id,
          senderName: bq?.fromName || senderFallback,
          recipientName: bq?.toName || "You",
          flowers: Array.isArray(bq?.flowers) && bq.flowers.length > 0
            ? bq.flowers
            : ["rose", "peony", "tulip", "camellia"],
          wrappingId: bq?.wrappingId || bq?.wrapping || "kraft",
          ribbonId: bq?.ribbonId || bq?.ribbon || "rose",
          greeneryId: bq?.greeneryId || bq?.greenery || "eucalyptus",
          atmosphereId: bq?.atmosphereId || bq?.atmosphere || "petals",
          message: bq?.message || n.body || "A handpicked digital bouquet for you. Thinking of you today and always.",
          createdAt: n.created_at,
          read: Boolean(n.read),
        };
      });

      return NextResponse.json({ success: true, bouquets });
    }

    // Single bouquet by ID
    const { data: notif, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !notif) {
      return NextResponse.json({ error: "Bouquet delivery not found" }, { status: 404 });
    }

    const bq = notif.metadata?.bouquet;
    const senderFallback = notif.title?.split(" ")[0] || "Your Partner";

    return NextResponse.json({
      success: true,
      notificationId: notif.id,
      read: notif.read,
      bouquet: {
        id: bq?.id || notif.id,
        flowers: Array.isArray(bq?.flowers) && bq.flowers.length > 0
          ? bq.flowers
          : ["rose", "peony", "tulip", "camellia"],
        wrappingId: bq?.wrappingId || bq?.wrapping || "kraft",
        ribbonId: bq?.ribbonId || bq?.ribbon || "rose",
        greeneryId: bq?.greeneryId || bq?.greenery || "eucalyptus",
        atmosphereId: bq?.atmosphereId || bq?.atmosphere || "petals",
        toName: bq?.toName || "My Favorite Person",
        fromName: bq?.fromName || senderFallback,
        message: bq?.message || notif.body || "A handpicked digital bouquet for you. Thinking of you today and always.",
        createdAt: notif.created_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load bouquet" }, { status: 500 });
  }
}
