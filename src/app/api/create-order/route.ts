import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/plans";
import { createCashfreeOrder, getResolvedCashfreeEnv } from "@/lib/cashfree";

// Sliding-window rate limiter per user (matching waitlist pattern in src/app/api/beta/waitlist/route.ts)
const rateLimitMap = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // Max 5 order creations per user per minute

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) || []).filter(
    (t) => now - t < WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS) {
    rateLimitMap.set(userId, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);

  // Periodic cleanup if map grows
  if (rateLimitMap.size > 5000) {
    for (const [key, times] of rateLimitMap.entries()) {
      const valid = times.filter((t) => now - t < WINDOW_MS);
      if (valid.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, valid);
      }
    }
  }

  return false;
}

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
        console.warn("[create-order] Bearer token verification failed:", err);
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

export async function POST(request: Request) {
  try {
    // 1. Authenticate user server-side (supports both Bearer token and Supabase session cookie)
    const user = await resolveUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in to create an order." },
        { status: 401 }
      );
    }

    // 2. Per-user Rate Limiting to prevent spam order creation
    if (isRateLimited(user.id)) {
      return NextResponse.json(
        {
          error:
            "Too many order creation requests. Please wait a moment before trying again.",
        },
        { status: 429 }
      );
    }

    // 3. Parse request payload
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    const { plan_id, phone, customer_name } = body;

    // 4. Server-Side Price Validation: resolve price strictly from plan ID
    if (!plan_id || typeof plan_id !== "string") {
      return NextResponse.json(
        {
          error:
            "plan_id is required. Price cannot be specified by the client.",
        },
        { status: 400 }
      );
    }

    const plan = getPlan(plan_id);
    if (!plan) {
      return NextResponse.json(
        {
          error: `Invalid plan_id '${plan_id}'. Choose a valid plan from the catalog.`,
        },
        { status: 400 }
      );
    }

    // 5. Generate unique Order ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const orderId = `cf_${plan.id}_${timestamp}_${randomSuffix}`;

    let baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.headers.get("origin") ||
      "https://www.pairfect.site";

    const isProd =
      (process.env.CASHFREE_ENV || "").toLowerCase() === "production";
    if (isProd && (baseUrl.startsWith("http://") || baseUrl.includes("localhost"))) {
      baseUrl = "https://www.pairfect.site";
    }

    const returnUrl = `${baseUrl}/payment-status?order_id={order_id}`;

    // 6. Call Cashfree PGCreateOrder via Node SDK
    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      orderAmount: plan.amount,
      orderCurrency: plan.currency,
      customerId: user.id,
      customerEmail: user.email || undefined,
      customerPhone: typeof phone === "string" ? phone : undefined,
      customerName:
        typeof customer_name === "string"
          ? customer_name
          : user.user_metadata?.display_name || "Pairfect User",
      returnUrl,
      notes: {
        plan_id: plan.id,
        user_id: user.id,
      },
    });

    const paymentSessionId = cashfreeOrder.payment_session_id;

    // 7. Persist initial order record in Supabase payments table via Admin Client
    try {
      const admin = createAdminClient();
      await admin.from("payments").insert({
        user_id: user.id,
        order_id: orderId,
        payment_session_id: paymentSessionId,
        amount: plan.amount,
        currency: plan.currency,
        status: "pending",
        gateway: "cashfree",
        customer_phone: typeof phone === "string" ? phone : null,
        customer_email: user.email || null,
        raw_response: cashfreeOrder,
      });
    } catch (dbErr) {
      // Non-blocking log if DB table migration has not been applied yet
      console.warn(
        "[create-order] Could not insert initial payment record into Supabase:",
        dbErr
      );
    }

    const { mode: cfMode } = getResolvedCashfreeEnv();

    return NextResponse.json({
      success: true,
      order_id: orderId,
      payment_session_id: paymentSessionId,
      amount: plan.amount,
      currency: plan.currency,
      plan_name: plan.name,
      cf_mode: cfMode,
    });
  } catch (err: any) {
    console.error("[Cashfree create-order error]:", err);
    const errorMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Internal server error creating Cashfree order";

    return NextResponse.json(
      { error: errorMessage, details: err?.response?.data },
      { status: err?.response?.status || 500 }
    );
  }
}
