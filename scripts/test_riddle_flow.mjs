import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:/Users/2006s/.gemini/antigravity/brain/d62feefa-3bfe-49f3-b7fe-da7d05850d16";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 }
  });

  const page = await context.newPage();

  console.log("1. Navigating to Riddle Night guest URL...");
  await page.goto("http://localhost:3000/riddle?room=RIDDLE8", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);

  // Check if guest modal appears
  const guestInput = page.locator("input[placeholder*='name or nickname']");
  if (await guestInput.isVisible()) {
    console.log("Guest modal is visible. Capturing screenshot...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "33-riddle-guest-join.png") });
    console.log("Captured 33-riddle-guest-join.png");

    await guestInput.fill("Devon");
    await page.click("button:has-text('Join the Room')");
    await page.waitForTimeout(1200);
  }

  // Capture lobby view
  console.log("2. Capturing Riddle lobby view...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "34-riddle-lobby.png") });
  console.log("Captured 34-riddle-lobby.png");

  // Click "Team up with Cozy Bot 🤖"
  console.log("3. Starting solo co-op mode with Cozy Bot...");
  const botBtn = page.locator("button:has-text('Team up with Cozy Bot')").first();
  await botBtn.click();
  await page.waitForTimeout(1500);

  // Capture Riddle Question screen
  console.log("4. Capturing Riddle Question screen...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "35-riddle-question-screen.png") });
  console.log("Captured 35-riddle-question-screen.png");

  // Type deduction and click lock-in
  console.log("5. Submitting player deduction...");
  const textarea = page.locator("textarea[placeholder*='confidential deduction']").first();
  await textarea.fill("A keyboard");
  await page.waitForTimeout(500);

  const lockBtn = page.locator("button:has-text('Lock In My Deduction')").first();
  await lockBtn.click();
  console.log("Locked in deduction. Waiting for Cozy Bot and reveal...");

  // Wait for reveal screen (Cozy Bot answers in ~2-3 seconds)
  await page.waitForSelector("text=PAIRFECT KEEPSAKE : RIDDLE NIGHT REPORT", { timeout: 12000 });
  await page.waitForTimeout(1200);

  // Capture Reveal and Keepsake Certificate Card
  console.log("6. Capturing Reveal and Keepsake Certificate Card...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "36-riddle-reveal-screen.png") });
  console.log("Captured 36-riddle-reveal-screen.png");

  // Click Pin to Memory Wall
  console.log("7. Clicking Pin to Memory Wall...");
  const pinBtn = page.locator("button:has-text('Pin to Memory Wall'), button:has-text('Pinned to Memories')").first();
  if (await pinBtn.isVisible()) {
    await pinBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "37-riddle-pinned-keepsake.png") });
    console.log("Captured 37-riddle-pinned-keepsake.png");
  }

  await browser.close();
  console.log("All Riddle Night tests passed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
