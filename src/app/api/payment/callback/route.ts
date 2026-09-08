import { NextResponse } from "next/server";
import crypto from "crypto";

async function handleCallback(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  let orderId = "";
  let paymentId = "";
  let signature = "";
  let errorDesc = "";

  try {
    if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        orderId = (formData.get("razorpay_order_id") as string) || "";
        paymentId = (formData.get("razorpay_payment_id") as string) || "";
        signature = (formData.get("razorpay_signature") as string) || "";
        errorDesc = (formData.get("error[description]") as string) || (formData.get("error") as string) || "";
      } else {
        const body = await request.json().catch(() => ({}));
        orderId = body.razorpay_order_id || "";
        paymentId = body.razorpay_payment_id || "";
        signature = body.razorpay_signature || "";
        errorDesc = body.error?.description || body.error || "";
      }
    } else {
      // GET query parameters fallback
      orderId = url.searchParams.get("razorpay_order_id") || "";
      paymentId = url.searchParams.get("razorpay_payment_id") || "";
      signature = url.searchParams.get("razorpay_signature") || "";
      errorDesc = url.searchParams.get("error[description]") || url.searchParams.get("error") || "";
    }

    if (errorDesc) {
      return NextResponse.redirect(
        new URL(`/checkout?status=error&message=${encodeURIComponent(errorDesc)}`, origin)
      );
    }

    if (!orderId || !paymentId || !signature) {
      return NextResponse.redirect(
        new URL(`/checkout?status=error&message=${encodeURIComponent("Missing payment verification details")}`, origin)
      );
    }

    if (!keySecret) {
      return NextResponse.redirect(
        new URL(`/checkout?status=error&message=${encodeURIComponent("Server secret not configured")}`, origin)
      );
    }

    // Verify HMAC-SHA256 signature
    const payload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const genBuf = Buffer.from(generatedSignature, "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");

    const isMatch =
      genBuf.length === sigBuf.length && crypto.timingSafeEqual(genBuf, sigBuf);

    if (isMatch) {
      return NextResponse.redirect(
        new URL(
          `/checkout?status=success&order_id=${encodeURIComponent(orderId)}&payment_id=${encodeURIComponent(paymentId)}`,
          origin
        )
      );
    } else {
      return NextResponse.redirect(
        new URL(`/checkout?status=error&message=${encodeURIComponent("Invalid payment signature")}`, origin)
      );
    }
  } catch (err: any) {
    console.error("[Razorpay callback error]:", err);
    return NextResponse.redirect(
      new URL(`/checkout?status=error&message=${encodeURIComponent(err?.message || "Internal error")}`, origin)
    );
  }
}

export async function POST(request: Request) {
  return handleCallback(request);
}

export async function GET(request: Request) {
  return handleCallback(request);
}
