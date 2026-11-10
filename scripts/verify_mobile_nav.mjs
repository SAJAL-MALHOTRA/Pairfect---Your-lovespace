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

async function getAvailablePort() {
  const http = await import("http");
  for (const port of [3000, 3001, 3002]) {
    try {
      const ok = await new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/login`, (res) => {
          resolve(res.statusCode < 500);
        });
        req.on("error", () => resolve(false));
        req.setTimeout(2000, () => {
          req.destroy();
          resolve(false);
        });
      });
      if (ok) return port;
    } catch {
      // try next
    }
  }
  return 3000;
}

async function main() {
  const port = 3002;
  console.log(`Using Next.js server on port ${port}...`);

  const timestamp = Date.now();
  const emailA = `maya_nav_${timestamp}@pairfect.site`;
  const emailB = `leo_nav_${timestamp}@pairfect.site`;
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

    // 2. Create active pair with 42-day streak
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

    const browser = await chromium.launch({ headless: true });

    // 1. Mobile Context (390 x 844 - iPhone 14/15/16)
    console.log("Capturing 390x844 mobile view...");
    const mobileCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileCtx.newPage();

    await mobilePage.goto(`http://localhost:${port}/login`, { waitUntil: "networkidle" });
    await mobilePage.fill("#email", emailA);
    await mobilePage.fill("#password", password);
    await mobilePage.click('button:has-text("Sign In")');
    await mobilePage.waitForURL("**/dashboard**", { timeout: 15000 });
    await mobilePage.waitForTimeout(2000);

    // Capture mobile dashboard header (390px)
    await mobilePage.screenshot({
      path: `${artifactDir}/68-navigation-mobile-fixed.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 68-navigation-mobile-fixed.png (390px viewport)");

    // 2. Ultra-narrow Context (375 x 667 - iPhone SE / compact)
    console.log("Capturing 375x667 compact mobile view...");
    const compactCtx = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
    });
    const compactPage = await compactCtx.newPage();
    await compactPage.goto(`http://localhost:${port}/login`, { waitUntil: "networkidle" });
    await compactPage.fill("#email", emailA);
    await compactPage.fill("#password", password);
    await compactPage.click('button:has-text("Sign In")');
    await compactPage.waitForURL("**/dashboard**", { timeout: 15000 });
    await compactPage.waitForTimeout(2000);

    await compactPage.screenshot({
      path: `${artifactDir}/69-navigation-iphone-se-fixed.png`,
      clip: { x: 0, y: 0, width: 375, height: 667 },
    });
    console.log("Captured 69-navigation-iphone-se-fixed.png (375px compact viewport)");

    // 3. Desktop Context (1280 x 950)
    console.log("Capturing 1280x950 desktop view...");
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 950 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopCtx.newPage();
    await desktopPage.goto(`http://localhost:${port}/login`, { waitUntil: "networkidle" });
    await desktopPage.fill("#email", emailA);
    await desktopPage.fill("#password", password);
    await desktopPage.click('button:has-text("Sign In")');
    await desktopPage.waitForURL("**/dashboard**", { timeout: 15000 });
    await desktopPage.waitForTimeout(2000);

    await desktopPage.screenshot({
      path: `${artifactDir}/70-navigation-desktop-fixed.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 70-navigation-desktop-fixed.png (Desktop viewport)");

    await browser.close();
    console.log("ALL NAVIGATION VERIFICATION SCREENSHOTS CAPTURED!");
  } finally {
    console.log("Cleaning up test data...");
    if (userA?.id) {
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
