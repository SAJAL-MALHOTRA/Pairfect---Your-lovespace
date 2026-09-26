import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCashfreeOrder } from "@/lib/cashfree";
import { grantPairSubscription } from "@/lib/subscription";

async function resolveUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      try {
        const admin = createAdminClient();
        const {
          data: { user },
          error,
        } = await admin.auth.getUser(token);
        if (!error && user) return user;
      } catch (err) {
        console.warn("[order-status] Bearer token verification failed:", err);
      }
    }
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id")?.trim();

    if (!orderId) {
      return NextResponse.json(
        { error: "order_id query parameter is required" },
        { status: 400 }
      );
    }

    // 1. Authenticate user
    const user = await resolveUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view order status." },
        { status: 401 }
      );
    }

    // 2. Fetch local payment record from Supabase payments table via Admin Client
    const admin = createAdminClient();
    const { data: paymentRecord, error: dbError } = await admin
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (dbError) {
      console.warn("[order-status] Database lookup warning:", dbError.message);
    }

    // 3. Authorization Check: verify the payment belongs to the authenticated user
    if (paymentRecord && paymentRecord.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have permission to access this order.",
        },
        { status: 403 }
      );
    }

    // 4. Fetch live, server-verified order state from Cashfree Gateway
    let cashfreeData: any = null;
    try {
      cashfreeData = await fetchCashfreeOrder(orderId);
    } catch (cfErr: any) {
      console.warn(
        `[order-status] Could not fetch live order ${orderId} from Cashfree API:`,
        cfErr?.response?.data?.message || cfErr?.message
      );
    }

    const orderStatus =
      cashfreeData?.order_status || paymentRecord?.status || "PENDING";

    // 5. If Cashfree confirms PAID, ensure payments table is synced and trigger fallback grant if needed
    if (
      (orderStatus === "PAID" || orderStatus === "SUCCESS") &&
      paymentRecord
    ) {
      if (paymentRecord.status !== "paid") {
        await admin
          .from("payments")
          .update({
            status: "paid",
            updated_at: new Date().toISOString(),
            raw_response: cashfreeData || paymentRecord.raw_response,
          })
          .eq("order_id", orderId);
      }

      // Fallback idempotent subscription grant in case webhook was delayed
      let planId: string | undefined = paymentRecord.metadata?.plan_id;
      if (!planId) {
        const orderIdParts = orderId.match(/^cf_([a-zA-Z0-9-]+)_\d+_/);
        if (orderIdParts && orderIdParts[1]) {
          planId = orderIdParts[1];
        }
      }

      if (paymentRecord.user_id && planId && !paymentRecord.metadata?.subscription_granted) {
        await grantPairSubscription({
          userId: paymentRecord.user_id,
          planId,
          orderId,
        });
      }
    }

    return NextResponse.json({
      order_id: orderId,
      order_status: orderStatus,
      amount: cashfreeData?.order_amount || paymentRecord?.amount,
      currency: cashfreeData?.order_currency || paymentRecord?.currency || "INR",
      payment_session_id: paymentRecord?.payment_session_id,
      created_at: paymentRecord?.created_at,
    });
  } catch (err: any) {
    console.error("[order-status exception]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error fetching order status" },
      { status: 500 }
    );
  }
}
