import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          error: "Missing required payment verification fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        },
        { status: 400 }
      );
    }

    // Step 3: Backend signature verification
    // HMAC SHA256 verification: crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const generatedSignatureBuf = Buffer.from(generatedSignature, "utf-8");
    const providedSignatureBuf = Buffer.from(String(razorpay_signature), "utf-8");

    // Timing-safe comparison to prevent timing attacks
    const isMatch =
      generatedSignatureBuf.length === providedSignatureBuf.length &&
      crypto.timingSafeEqual(generatedSignatureBuf, providedSignatureBuf);

    if (!isMatch) {
      return NextResponse.json(
        {
          verified: false,
          error: "Invalid payment signature.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      message: "Payment verified successfully",
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });
  } catch (err: any) {
    console.error("[Razorpay verify-payment error]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error verifying payment" },
      { status: 500 }
    );
  }
}
