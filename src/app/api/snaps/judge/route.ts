import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { huntId } = await req.json();
    if (!huntId) {
      return NextResponse.json({ error: "Hunt ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch the snap hunt details
    const { data: hunt, error: huntErr } = await supabase
      .from("snap_hunts")
      .select("*")
      .eq("id", huntId)
      .single();

    if (huntErr || !hunt) {
      return NextResponse.json({ error: "Snap hunt not found" }, { status: 404 });
    }

    // 2. Fetch the entries
    const { data: entries, error: entriesErr } = await supabase
      .from("snap_hunt_entries")
      .select("*")
      .eq("hunt_id", huntId);

    if (entriesErr || !entries || entries.length < 2) {
      return NextResponse.json({ error: "Both entries must be submitted to judge" }, { status: 400 });
    }

    // 3. Fetch pair to match A and B users
    const { data: pair } = await supabase
      .from("pairs")
      .select("*")
      .eq("id", hunt.pair_id)
      .single();

    if (!pair) {
      return NextResponse.json({ error: "Pair association not found" }, { status: 404 });
    }

    const { data: userA } = await supabase.from("users").select("display_name").eq("id", pair.user_a_id).single();
    const { data: userB } = await supabase.from("users").select("display_name").eq("id", pair.user_b_id).single();

    const nameA = userA?.display_name || "Partner A";
    const nameB = userB?.display_name || "Partner B";

    const entryA = entries.find((e: any) => e.user_id === pair.user_a_id);
    const entryB = entries.find((e: any) => e.user_id === pair.user_b_id);

    if (!entryA || !entryB) {
      return NextResponse.json({ error: "Could not map entries to partner IDs" }, { status: 400 });
    }

    // 4. Download images from storage and convert to base64
    const downloadImageAsBase64 = async (photoUrl: string) => {
      const { data: fileBlob, error: downloadErr } = await supabase.storage
        .from("memories")
        .download(photoUrl);

      if (downloadErr || !fileBlob) {
        throw new Error(`Failed to download photo from storage: ${photoUrl}`);
      }

      const buffer = Buffer.from(await fileBlob.arrayBuffer());
      return {
        base64: buffer.toString("base64"),
        mimeType: fileBlob.type || "image/jpeg"
      };
    };

    const imageA = await downloadImageAsBase64(entryA.photo_url);
    const imageB = await downloadImageAsBase64(entryB.photo_url);

    // 5. Construct Vision Prompt
    const prompt = `Two partners were given this scavenger hunt clue: "${hunt.clue}"
They each found and photographed an object matching it. Look at the two attached images.

Image 1 is submitted by ${nameA}.
Image 2 is submitted by ${nameB}.

Judge which find is more clever, creative, or funnier — not just "correct". 
Reward the unexpected or funny pick over the obvious one.

Respond in JSON exactly matching this structure:
{
  "winner": "A" or "B",
  "reasoning": "2 warm, playful sentences explaining why their item was chosen..."
}

Provide ONLY the raw JSON output. Do not wrap it in markdown code blocks.`;

    // 6. Invoke Gemini Vision API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    // Use gemini-2.5-flash which supports visual multi-modal prompts
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const partA = {
      inlineData: {
        data: imageA.base64,
        mimeType: imageA.mimeType
      }
    };

    const partB = {
      inlineData: {
        data: imageB.base64,
        mimeType: imageB.mimeType
      }
    };

    const response = await model.generateContent([prompt, partA, partB]);
    const textOutput = response.response.text();
    const result = JSON.parse(textOutput);

    const winnerLetter = result.winner; // "A" or "B"
    const winnerUserId = winnerLetter === "B" ? pair.user_b_id : pair.user_a_id;

    // 7. Write Result to Database and update Hunt Status
    const { data: huntResult, error: insertErr } = await supabase
      .from("snap_hunt_results")
      .insert({
        hunt_id: huntId,
        winner_user_id: winnerUserId,
        reasoning: result.reasoning
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Update status to judged
    await supabase
      .from("snap_hunts")
      .update({ status: "judged" })
      .eq("id", huntId);

    return NextResponse.json({ success: true, result: huntResult });
  } catch (err: any) {
    console.error("Snap Hunt Judge Error:", err);
    return NextResponse.json({ error: err.message || "Failed to judge snap hunt entries" }, { status: 500 });
  }
}
