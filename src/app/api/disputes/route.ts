import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get("pairId");
    const disputeId = searchParams.get("disputeId");

    // ── CASE 1: Fetch Specific Dispute Details (Arguments & Verdict) ──
    if (disputeId) {
      const { data: dispute, error: dispErr } = await supabase
        .from("vibe_disputes")
        .select("*")
        .eq("id", disputeId)
        .single();

      if (dispErr || !dispute) {
        return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
      }

      // Fetch arguments
      const { data: args, error: argsErr } = await supabase
        .from("dispute_arguments")
        .select("*")
        .eq("dispute_id", disputeId);

      if (argsErr) throw argsErr;

      // Decrypt arguments
      const decryptedArgs = (args || []).map((arg: any) => ({
        ...arg,
        argument_text: decrypt(arg.argument_text),
      }));

      // Fetch verdict if judged
      let decryptedVerdict = null;
      if (dispute.status === "judged") {
        const { data: verd, error: verdErr } = await supabase
          .from("dispute_verdicts")
          .select("*")
          .eq("dispute_id", disputeId)
          .maybeSingle();

        if (verdErr) throw verdErr;
        if (verd) {
          decryptedVerdict = {
            ...verd,
            verdict_text: decrypt(verd.verdict_text),
          };
        }
      }

      return NextResponse.json({
        dispute,
        arguments: decryptedArgs,
        verdict: decryptedVerdict,
      });
    }

    // ── CASE 2: Fetch Disputes List ──
    if (pairId) {
      const { data: disputes, error: selectErr } = await supabase
        .from("vibe_disputes")
        .select(`
          *,
          dispute_verdicts (
            id,
            winner_user_id,
            verdict_text,
            playful_sentence
          )
        `)
        .eq("pair_id", pairId)
        .order("created_at", { ascending: false });

      if (selectErr) throw selectErr;

      // Decrypt verdict texts
      const decryptedDisputes = (disputes || []).map((disp: any) => {
        if (disp.dispute_verdicts && disp.dispute_verdicts.length > 0) {
          disp.dispute_verdicts = disp.dispute_verdicts.map((v: any) => ({
            ...v,
            verdict_text: decrypt(v.verdict_text),
          }));
        }
        return disp;
      });

      return NextResponse.json(decryptedDisputes);
    }

    return NextResponse.json({ error: "Missing pairId or disputeId" }, { status: 400 });
  } catch (err: any) {
    console.error("GET disputes error:", err);
    return NextResponse.json({ error: err.message || "Failed to load disputes" }, { status: 500 });
  }
}
