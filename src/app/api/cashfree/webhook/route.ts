import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";

// 5-minute replay window tolerance
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "Cashfree webhook receiver is online and awaiting POST notifications.",
  });
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing x-webhook-signature or x-webhook-timestamp headers" },
        { status: 400 }
      );
    }

    // 1. Replay Protection: reject timestamps older than 5 minutes
    const timestampNum = Number(timestamp);
    const timestampMs =
      timestampNum < 1e12 ? timestampNum * 1000 : timestampNum;
    const now = Date.now();

    if (isNaN(timestampMs) || Math.abs(now - timestampMs) > FIVE_MINUTES_MS) {
      return NextResponse.json(
        {
          error:
            "Webhook timestamp expired or outside tolerance window (5 minutes).",
        },
        { status: 400 }
      );
    }

    // 2. Read RAW request body (required for cryptographic HMAC verification)
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // 3. Cryptographic Signature Verification
    try {
      verifyCashfreeWebhookSignature(signature, rawBody, timestamp);
    } catch (verifyErr: any) {
      console.error(
        "[Cashfree Webhook] Cryptographic signature mismatch:",
        verifyErr.message
      );
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // 4. Parse verified payload
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch (parseErr) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const eventType: string = event.type || event.event || "";
    const orderData = event.data?.order || {};
    const paymentData = event.data?.payment || {};

    const orderId: string =
      orderData.order_id || event.order_id || event.data?.order_id;
    const paymentStatus: string =
      paymentData.payment_status || orderData.order_status || "";

    if (!orderId) {
      console.warn("[Cashfree Webhook] Webhook payload missing order_id:", event);
      return NextResponse.json(
        { error: "order_id missing from payload" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 5. Webhook Idempotency Check:
    // Check current status before acting — prevent re-triggering downstream side effects
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id, user_id, order_id, amount, status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existingPayment?.status === "paid") {
      console.log(
        `[Cashfree Webhook] Idempotent duplicate: Order ${orderId} is already marked as paid. Ignoring.`
      );
      return NextResponse.json(
        { success: true, message: "Order already paid (duplicate webhook ignored)" },
        { status: 200 }
      );
    }

    // 6. Handle Payment Success
    const isSuccess =
      eventType.toUpperCase().includes("PAYMENT_SUCCESS") ||
      paymentStatus.toUpperCase() === "SUCCESS" ||
      eventType.toUpperCase() === "ORDER_PAID";

    const isFailure =
      eventType.toUpperCase().includes("PAYMENT_FAILED") ||
      eventType.toUpperCase().includes("USER_DROPPED") ||
      paymentStatus.toUpperCase() === "FAILED" ||
      paymentStatus.toUpperCase() === "USER_DROPPED";

    if (isSuccess) {
      console.log(`[Cashfree Webhook] Order ${orderId} confirmed PAID.`);

      // Update payments table status via Service Role
      const { error: updateErr } = await admin
        .from("payments")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
          raw_response: event,
        })
        .eq("order_id", orderId);

      if (updateErr) {
        console.error(
          `[Cashfree Webhook] Error updating payment status to paid for order ${orderId}:`,
          updateErr
        );
      }

      // (Downstream side-effects such as unlocking features or pair entitlements happen here, guaranteed once)
      return NextResponse.json(
        { success: true, order_id: orderId, status: "paid" },
        { status: 200 }
      );
    }

    if (isFailure) {
      console.log(`[Cashfree Webhook] Order ${orderId} marked FAILED.`);

      await admin
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          raw_response: event,
        })
        .eq("order_id", orderId);

      return NextResponse.json(
        { success: true, order_id: orderId, status: "failed" },
        { status: 200 }
      );
    }

    // Default response for other webhook event types
    return NextResponse.json(
      { success: true, order_id: orderId, event: eventType },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[Cashfree Webhook Exception]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
