import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get("pairId");

    if (!pairId) {
      return NextResponse.json({ error: "Pair ID is required" }, { status: 400 });
    }

    // Query letters
    const { data: letters, error: selectErr } = await supabase
      .from("love_letters")
      .select("*")
      .eq("pair_id", pairId)
      .order("sent_at", { ascending: false });

    if (selectErr) throw selectErr;

    // Decrypt content field for each letter
    const decryptedLetters = (letters || []).map((letter: any) => {
      let decryptedContent = letter.content;

      if (typeof letter.content === "string") {
        if (letter.content.startsWith("enc:v1:")) {
          return { ...letter, content: letter.content };
        }
        try {
          const decryptedStr = decrypt(letter.content);
          if (typeof decryptedStr === "string" && (decryptedStr.startsWith("[") || decryptedStr.startsWith("{"))) {
            decryptedContent = JSON.parse(decryptedStr);
          } else if (typeof decryptedStr === "string" && !decryptedStr.startsWith("enc:")) {
            decryptedContent = [{ type: "text", value: decryptedStr }];
          } else {
            decryptedContent = [{ type: "text", value: "A handwritten letter for you ♡" }];
          }
        } catch (e) {
          console.error("Failed to parse decrypted letter content:", e);
          decryptedContent = [{ type: "text", value: "A handwritten letter for you ♡" }];
        }
      }

      // Final safeguard: ensure content is always an array of blocks and never an enc: string
      if (!Array.isArray(decryptedContent)) {
        if (typeof decryptedContent === "string" && !decryptedContent.startsWith("enc:")) {
          decryptedContent = [{ type: "text", value: decryptedContent }];
        } else {
          decryptedContent = [{ type: "text", value: "A handwritten letter for you ♡" }];
        }
      }

      return { ...letter, content: decryptedContent };
    });

    return NextResponse.json(decryptedLetters);
  } catch (err: any) {
    console.error("GET love-letters error:", err);
    return NextResponse.json({ error: err.message || "Failed to load letters" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pairId, recipientName, senderName, content, envelopeStyle, unseal_at } = await request.json();

    if (!pairId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (unseal_at) {
      const unsealDate = new Date(unseal_at);
      if (isNaN(unsealDate.getTime()) || unsealDate <= new Date()) {
        return NextResponse.json({ error: "Invalid unseal date" }, { status: 400 });
      }
    }

    // Encrypt the JSON structure of content blocks
    const contentString = JSON.stringify(content);
    const ciphertext = typeof content === "string" && content.startsWith("enc:v1:")
      ? content
      : encrypt(contentString);

    const { data, error: insertErr } = await supabase
      .from("love_letters")
      .insert({
        pair_id: pairId,
        sender_id: user.id,
        recipient_name: recipientName,
        sender_name: senderName,
        content: ciphertext, // Saved as encrypted JSONB string
        envelope_style: envelopeStyle,
        unseal_at: unseal_at || null
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, letter: data });
  } catch (err: any) {
    console.error("POST love-letters error:", err);
    return NextResponse.json({ error: err.message || "Failed to send letter" }, { status: 500 });
  }
}
