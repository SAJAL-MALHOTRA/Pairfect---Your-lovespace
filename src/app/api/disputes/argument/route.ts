import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { disputeId, argumentText } = await request.json();

    if (!disputeId || !argumentText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Encrypt the argument text
    const encryptedText = encrypt(argumentText.trim());

    const { data, error: insertErr } = await supabase
      .from("dispute_arguments")
      .insert({
        dispute_id: disputeId,
        user_id: user.id,
        argument_text: encryptedText,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Submit argument error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit argument" }, { status: 500 });
  }
}
