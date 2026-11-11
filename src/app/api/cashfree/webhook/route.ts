import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { grantPairSubscription } from "@/lib/subscription";

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

    // 1. Read RAW request body (required for cryptographic HMAC verification and probe detection)
    const rawBody = await request.text();

    // 2. Dashboard Connectivity Test Handling:
    // Cashfree dashboard "Test" button sends a probe (empty body, dummy headers, or {})
    // to check if the server is alive and responds with 200 OK.
    if (!rawBody || rawBody.trim() === "" || rawBody.trim() === "{}" || (!signature && !timestamp)) {
      return NextResponse.json(
        {
          status: "ok",
          message: "Cashfree webhook test endpoint reached successfully.",
        },
        { status: 200 }
      );
    }

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing x-webhook-signature or x-webhook-timestamp headers" },
        { status: 400 }
      );
    }

    // 3. Replay Protection: reject timestamps older than 5 minutes
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

    // 4. Cryptographic Signature Verification
    try {
      verifyCashfreeWebhookSignature(signature, rawBody, timestamp);
    } catch (verifyErr: any) {
      // If Cashfree dashboard sends a test event with dummy signature
      if (
        rawBody.includes('"TEST"') ||
        rawBody.includes('"test"') ||
        rawBody.includes('"SIMULATION"')
      ) {
        return NextResponse.json(
          { status: "ok", message: "Cashfree test webhook simulation acknowledged." },
          { status: 200 }
        );
      }
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

    // 5. Webhook Idempotency & Grant Recovery Check:
    // If order is already paid AND subscription was already recorded as granted, ignore duplicate.
    // If order was marked paid but server died before granting, proceed to grant recovery.
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id, user_id, order_id, amount, currency, status, metadata")
      .eq("order_id", orderId)
      .maybeSingle();

    const isAlreadyPaid = existingPayment?.status === "paid";
    const isAlreadyGranted = !!existingPayment?.metadata?.subscription_granted;

    if (isAlreadyPaid && isAlreadyGranted) {
      console.log(
        `[Cashfree Webhook] Idempotent duplicate: Order ${orderId} is already paid and subscription granted. Ignoring.`
      );
      return NextResponse.json(
        { success: true, message: "Order already paid and granted (duplicate webhook ignored)" },
        { status: 200 }
      );
    }

    if (isAlreadyPaid && !isAlreadyGranted) {
      console.warn(
        `[Cashfree Webhook] Recovery mode: Order ${orderId} was marked paid but subscription grant was not completed. Proceeding to grant recovery.`
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

      // 6a. Server-Side Price & Currency Integrity Validation
      const incomingAmount = Number(paymentData.payment_amount || orderData.order_amount);
      const incomingCurrency = String(paymentData.payment_currency || orderData.order_currency || "INR").toUpperCase();
      const expectedAmount = Number(existingPayment?.amount);
      const expectedCurrency = String(existingPayment?.currency || "INR").toUpperCase();

      if (expectedAmount > 0 && !isNaN(incomingAmount) && incomingAmount < expectedAmount) {
        console.error(
          `[Cashfree Webhook] Underpayment detected for order ${orderId}: Received ${incomingAmount} ${incomingCurrency}, expected ${expectedAmount} ${expectedCurrency}`
        );
        return NextResponse.json(
          { error: `Payment amount ${incomingAmount} is less than required order amount ${expectedAmount}` },
          { status: 400 }
        );
      }

      if (expectedCurrency && incomingCurrency !== expectedCurrency) {
        console.error(
          `[Cashfree Webhook] Currency mismatch for order ${orderId}: Received ${incomingCurrency}, expected ${expectedCurrency}`
        );
        return NextResponse.json(
          { error: `Currency ${incomingCurrency} does not match expected ${expectedCurrency}` },
          { status: 400 }
        );
      }

      // 6b. Atomic check-and-set state transition (if not already paid)
      if (!isAlreadyPaid) {
        const { data: updatedPayment, error: updateErr } = await admin
          .from("payments")
          .update({
            status: "paid",
            updated_at: new Date().toISOString(),
            raw_response: event,
          })
          .eq("order_id", orderId)
          .or("status.neq.paid,status.is.null")
          .select()
          .maybeSingle();

        if (updateErr) {
          console.error(
            `[Cashfree Webhook] Error updating payment status to paid for order ${orderId}:`,
            updateErr
          );
        }

        // If no row was updated and order wasn't previously paid, concurrent delivery won
        if (!updatedPayment) {
          console.log(
            `[Cashfree Webhook] Concurrent duplicate detected for order ${orderId}. Already processed by concurrent worker.`
          );
          return NextResponse.json(
            { success: true, message: "Order already paid (concurrent webhook suppressed)" },
            { status: 200 }
          );
        }
      }

      // 6c. Resolve plan ID and target user ID
      let planId: string | undefined = existingPayment?.metadata?.plan_id;
      if (!planId) {
        const orderIdParts = orderId.match(/^cf_([a-zA-Z0-9-]+)_\d+_/);
        if (orderIdParts && orderIdParts[1]) {
          planId = orderIdParts[1];
        }
      }
      if (!planId && (orderData?.order_notes?.plan_id || event.data?.order?.order_notes?.plan_id)) {
        planId = orderData?.order_notes?.plan_id || event.data?.order?.order_notes?.plan_id;
      }

      const targetUserId =
        existingPayment?.user_id ||
        orderData?.order_notes?.user_id ||
        event.data?.order?.order_notes?.user_id ||
        orderData?.customer_details?.customer_id;

      // 6d. Authoritative subscription grant to user's pair
      if (targetUserId && planId) {
        const grantResult = await grantPairSubscription({
          userId: targetUserId,
          planId,
          orderId,
        });
        console.log(`[Cashfree Webhook] Subscription grant outcome for order ${orderId}:`, grantResult);

        if (!grantResult.success) {
          // Reset payment status to pending so Cashfree webhook retry will re-attempt grant
          await admin
            .from("payments")
            .update({ status: "pending", updated_at: new Date().toISOString() })
            .eq("order_id", orderId);

          return NextResponse.json(
            { error: `Subscription grant failed: ${grantResult.message}. Cashfree will retry.` },
            { status: 500 }
          );
        }
      } else {
        console.warn(
          `[Cashfree Webhook] Warning: Could not resolve target user or plan for order ${orderId}. (targetUserId: ${targetUserId}, planId: ${planId})`
        );
      }

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
