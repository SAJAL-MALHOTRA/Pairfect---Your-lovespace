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
  const port = 3002;
  const timestamp = Date.now();
  const emailA = `maya_ks_${timestamp}@pairfect.site`;
  const emailB = `leo_ks_${timestamp}@pairfect.site`;
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

    // 3. Launch browser
    const browser = await chromium.launch({ headless: true });

    // Desktop session
    const desktopCtx = await browser.newContext({
      viewport: { width: 1280, height: 950 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopCtx.newPage();

    console.log("Logging in...");
    await desktopPage.goto(`http://localhost:${port}/login`, { waitUntil: "networkidle" });
    await desktopPage.fill("#email", emailA);
    await desktopPage.fill("#password", password);
    await desktopPage.click('button:has-text("Sign In")');
    await desktopPage.waitForURL("**/dashboard**", { timeout: 15000 });
    await desktopPage.waitForTimeout(2000);

    // 1. Capture Dashboard with Single New Mascot
    console.log("Capturing dashboard...");
    await desktopPage.screenshot({
      path: `${artifactDir}/74-dashboard-new-beans-mascot.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 74-dashboard-new-beans-mascot.png");

    // 2. Navigate to Love Letter Vault
    console.log("Navigating to /love-letter...");
    await desktopPage.goto(`http://localhost:${port}/love-letter`, { waitUntil: "networkidle" });
    await desktopPage.waitForSelector("text=Love Letters", { timeout: 10000 });
    await desktopPage.waitForTimeout(1000);

    await desktopPage.screenshot({
      path: `${artifactDir}/75-love-letter-new-beans-mascot.png`,
      clip: { x: 0, y: 0, width: 1280, height: 950 },
    });
    console.log("Captured 75-love-letter-new-beans-mascot.png");

    // 3. Mobile View of Dashboard (390px)
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

    await mobilePage.screenshot({
      path: `${artifactDir}/76-dashboard-mobile-new-beans-mascot.png`,
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
    console.log("Captured 76-dashboard-mobile-new-beans-mascot.png");

    await browser.close();
    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
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
