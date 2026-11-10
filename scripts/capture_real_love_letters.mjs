import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const admin = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);
const artifactDir = "C:\\Users\\2006s\\.gemini\\antigravity\\brain\\d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function main() {
  const timestamp = Date.now();
  const emailA = `maya_${timestamp}@pairfect.site`;
  const emailB = `leo_${timestamp}@pairfect.site`;
  const password = "TestPassword123!";

  console.log("Creating test users...");
  const { data: userAData, error: errA } = await admin.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Maya" },
  });
  if (errA) throw errA;

  const { data: userBData, error: errB } = await admin.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Leo" },
  });
  if (errB) throw errB;

  const userA = userAData.user;
  const userB = userBData.user;

  try {
    // 1. Ensure public profiles exist
    await admin.from("users").upsert([
      { id: userA.id, display_name: "Maya" },
      { id: userB.id, display_name: "Leo" },
    ]);

    // 2. Create active pair
    const { data: pair, error: pairErr } = await admin
      .from("pairs")
      .insert({
        user_a_id: userA.id,
        user_b_id: userB.id,
        invite_code: `P${timestamp.toString().slice(-5)}`,
        status: "active",
        started_dating_date: "2024-02-14",
        current_streak: 42,
      })
      .select()
      .single();
    if (pairErr) throw pairErr;
    console.log("Pair created:", pair.id);

    // 3. Insert real sample love letters
    const { data: letters, error: letterErr } = await admin.from("love_letters").insert([
      {
        pair_id: pair.id,
        sender_id: userB.id,
        recipient_name: "Maya",
        sender_name: "Leo",
        content: [
          {
            type: "text",
            value: "My favorite part of every single day is waking up knowing you are in my life. Thank you for making our sanctuary feel like home.",
          },
        ],
        envelope_style: "classic",
        is_opened: false,
        sent_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        pair_id: pair.id,
        sender_id: userA.id,
        recipient_name: "Leo",
        sender_name: "Maya",
        content: [
          {
            type: "text",
            value: "Happy 6 months my love! Looking back at our first date and how far we have come, my heart is so full.",
          },
        ],
        envelope_style: "velvet",
        is_opened: true,
        sent_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        opened_at: new Date(Date.now() - 86400000 * 9).toISOString(),
      },
    ]).select();
    if (letterErr) throw letterErr;
    console.log("Letters created:", letters?.length);

    // 4. Launch browser and sign in
    const browser = await chromium.launch({ headless: true });

    // Desktop Context
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 950 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopCtx.newPage();

    console.log("Logging into desktop session...");
    await desktopPage.goto("http://localhost:3002/login", { waitUntil: "networkidle" });
    await desktopPage.fill("#email", emailA);
    await desktopPage.fill("#password", password);
    await desktopPage.click('button:has-text("Sign In")');

    // Wait for redirect to dashboard
    await desktopPage.waitForURL("**/dashboard**", { timeout: 15000 });
    console.log("Logged in and reached dashboard!");
    await desktopPage.waitForTimeout(2000);

    // Navigate to Love Letter Vault
    console.log("Navigating to /love-letter...");
    await desktopPage.goto("http://localhost:3002/love-letter", { waitUntil: "networkidle" });
    await desktopPage.waitForSelector("text=Love Letters", { timeout: 10000 });
    await desktopPage.waitForTimeout(1000);

    // 1. Capture 61-love-letter-inbox.png (Desktop)
    await desktopPage.screenshot({
      path: `${artifactDir}/61-love-letter-inbox.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 61-love-letter-inbox.png (Vault with sealed wax envelopes & mascot)");

    // 2. Click "Write Letter" button
    console.log("Clicking 'Write Letter' button...");
    await desktopPage.click('button:has-text("Write Letter")');
    await desktopPage.waitForSelector("text=Write Your Love Letter", { timeout: 10000 });
    await desktopPage.waitForTimeout(500);

    // Click "Anniversary" inspiration starter
    const annivBtn = await desktopPage.$('button:has-text("Anniversary")');
    if (annivBtn) {
      await annivBtn.click();
      await desktopPage.waitForTimeout(400);
    }

    // Capture 62-love-letter-compose.png (Step 1)
    await desktopPage.screenshot({
      path: `${artifactDir}/62-love-letter-compose.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 62-love-letter-compose.png (Step 1: Write with parchment)");

    // 3. Click "Choose Envelope Wrap →"
    console.log("Advancing to Step 2...");
    await desktopPage.click('button:has-text("Choose Envelope Wrap")');
    await desktopPage.waitForSelector("text=Select Outer Envelope", { timeout: 5000 });
    await desktopPage.waitForTimeout(500);

    // Capture 63-love-letter-envelope-picker.png (Step 2)
    await desktopPage.screenshot({
      path: `${artifactDir}/63-love-letter-envelope-picker.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 63-love-letter-envelope-picker.png (Step 2: Envelope Picker)");

    // 4. Click "Address & Deliver →"
    console.log("Advancing to Step 3...");
    await desktopPage.click('button:has-text("Address & Deliver")');
    await desktopPage.waitForSelector("text=Address Your Envelope", { timeout: 5000 });
    await desktopPage.waitForTimeout(500);

    // Capture 64-love-letter-seal-and-deliver.png (Step 3)
    await desktopPage.screenshot({
      path: `${artifactDir}/64-love-letter-seal-and-deliver.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 64-love-letter-seal-and-deliver.png (Step 3: Seal & Deliver)");

    // 5. Back to Inbox
    console.log("Returning to Inbox...");
    await desktopPage.click('button:has-text("Back to Inbox")');
    await desktopPage.waitForSelector("text=Waiting to be Unsealed", { timeout: 5000 });
    await desktopPage.waitForTimeout(600);

    // 6. Click unread letter to open 3D wax envelope
    console.log("Clicking unread letter...");
    await desktopPage.click('button:has-text("From Leo")');
    await desktopPage.waitForSelector("text=A HANDWRITTEN LETTER AWAITS YOU", { timeout: 5000 });
    await desktopPage.waitForTimeout(800);

    // Capture 65-love-letter-wax-envelope.png
    await desktopPage.screenshot({
      path: `${artifactDir}/65-love-letter-wax-envelope.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 65-love-letter-wax-envelope.png (3D Wax Envelope ready to break seal)");

    // 7. Click wax seal button to shatter and unseal
    console.log("Breaking wax seal...");
    const waxButton = await desktopPage.$('button:has(svg.lucide-heart)');
    if (waxButton) {
      await waxButton.click();
    } else {
      await desktopPage.mouse.click(640, 520);
    }
    await desktopPage.waitForSelector("text=SEALED FOR YOU", { timeout: 8000 });
    await desktopPage.waitForTimeout(1500);

    // Capture 66-love-letter-unsealed-reading.png
    await desktopPage.screenshot({
      path: `${artifactDir}/66-love-letter-unsealed-reading.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 66-love-letter-unsealed-reading.png (Opened parchment with reply button)");

    // 8. Mobile View Context for Inbox
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileCtx.newPage();

    console.log("Logging into mobile session...");
    await mobilePage.goto("http://localhost:3002/login", { waitUntil: "networkidle" });
    await mobilePage.fill("#email", emailA);
    await mobilePage.fill("#password", password);
    await mobilePage.click('button:has-text("Sign In")');
    await mobilePage.waitForURL("**/dashboard**", { timeout: 15000 });
    await mobilePage.waitForTimeout(1500);

    await mobilePage.goto("http://localhost:3002/love-letter", { waitUntil: "networkidle" });
    await mobilePage.waitForSelector("text=Love Letters", { timeout: 10000 });
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({
      path: `${artifactDir}/67-love-letter-mobile-inbox.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 67-love-letter-mobile-inbox.png (Mobile Love Letter Vault)");

    await browser.close();
    console.log("ALL REAL LOVE LETTER SCREENSHOTS CAPTURED SUCCESSFULLY!");
  } finally {
    // Cleanup
    console.log("Cleaning up test data...");
    if (userA?.id) {
      await admin.from("love_letters").delete().or(`sender_id.eq.${userA.id},sender_id.eq.${userB.id}`);
      await admin.from("pairs").delete().or(`user_a_id.eq.${userA.id},user_b_id.eq.${userA.id}`);
      await admin.from("users").delete().in("id", [userA.id, userB.id]);
      await admin.auth.admin.deleteUser(userA.id).catch(() => {});
      await admin.auth.admin.deleteUser(userB.id).catch(() => {});
    }
    console.log("Cleanup complete!");
  }
}

main().catch((err) => {
  console.error("Main execution failed:", err);
  process.exit(1);
});
