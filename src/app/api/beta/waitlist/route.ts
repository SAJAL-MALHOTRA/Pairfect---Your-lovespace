import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// In-memory sliding window rate limiter: IP -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5; // Max 5 requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(
    t => now - t < WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS) {
    rateLimitMap.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  // Periodically clean up old entries if map grows
  if (rateLimitMap.size > 10000) {
    for (const [key, times] of rateLimitMap.entries()) {
      const valid = times.filter(t => now - t < WINDOW_MS);
      if (valid.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, valid);
      }
    }
  }

  return false;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "anonymous";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many waitlist requests. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, hp, website } = body;

    // 2. Honeypot check: If bot filled out invisible fields, silently accept without writing
    if (hp || website) {
      return NextResponse.json({
        success: true,
        message: "You've been added to the early access waitlist!",
      });
    }

    // 3. Email Validation
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 4. Supabase Recording
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);

      await supabase.from("beta_waitlist").upsert(
        {
          email: cleanEmail,
          created_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "You've been added to the early access waitlist! We'll email your invite code soon.",
    });
  } catch (error: any) {
    console.error("[Beta Waitlist API Error]:", error);
    return NextResponse.json({
      success: true,
      message: "You've been added to the early access waitlist!",
    });
  }
}
