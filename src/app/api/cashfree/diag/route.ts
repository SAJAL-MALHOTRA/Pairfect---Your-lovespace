import { NextResponse } from "next/server";
import { getResolvedCashfreeEnv, createCashfreeOrder } from "@/lib/cashfree";

export const dynamic = "force-dynamic";

export async function GET() {
  const appId = process.env.CASHFREE_APP_ID || "";
  const secretKey = process.env.CASHFREE_SECRET_KEY || "";
  const envVar = process.env.CASHFREE_ENV || "";
  const nextPublicEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV || "";
  const resolved = getResolvedCashfreeEnv();

  const mask = (val: string) =>
    val
      ? `${val.substring(0, 8)}...${val.substring(val.length - 4)} (len: ${val.length})`
      : "MISSING_OR_EMPTY";

  let probeResult = null;
  let probeError = null;

  try {
    probeResult = await createCashfreeOrder({
      orderId: "diag_probe_" + Date.now(),
      orderAmount: 1.0,
      orderCurrency: "INR",
      customerId: "diag_probe_user",
      customerPhone: "9999999999",
      customerEmail: "diag@pairfect.site",
      customerName: "Diag User",
      returnUrl: "https://www.pairfect.site/payment-status?order_id={order_id}",
    });
  } catch (err: any) {
    probeError = {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    };
  }

  return NextResponse.json({
    app_id: mask(appId),
    secret_key: mask(secretKey),
    cashfree_env_var: envVar || "NOT_SET",
    next_public_cashfree_env_var: nextPublicEnv || "NOT_SET",
    resolved_mode: resolved.mode,
    probe_success: !!probeResult,
    probe_order_id: probeResult?.cf_order_id || null,
    probe_error: probeError,
  });
}
