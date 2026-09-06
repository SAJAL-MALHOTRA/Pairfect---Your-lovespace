import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * High-precision server timestamp endpoint for photobooth NTP-style synchronization.
 */
export async function GET() {
  const serverTime = Date.now();

  return NextResponse.json(
    { t: serverTime, serverTime },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
